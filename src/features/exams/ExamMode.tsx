import { useEffect, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetExercisesQuery } from "../exercises/exercisesApi";
import { type ExamAttempt, useFinishExamMutation, useGetActiveExamsQuery, useGetMyResultsQuery, useGetUserExamInfoQuery, useStartExamMutation } from "./examsApi";
import { useCreateSolutionMutation } from "../solutions/solutionsApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link } from "react-router-dom";

const formatSeconds = (seconds: number) => {
    const safeValue = Math.max(seconds, 0);
    const minutes = Math.floor(safeValue / 60).toString().padStart(2, "0");
    const restSeconds = Math.floor(safeValue % 60).toString().padStart(2, "0");
    return `${minutes}:${restSeconds}`;
};

const difficultyLabels = ["Легкая", "Средняя", "Сложная"];

type SavedAttemptState = {
    examId: number;
    attemptId: number;
    deploymentId: number;
    startedAt: string;
    durationMinutes: number;
    answers: Record<number, string>;
};

const STORAGE_KEY = "exam_attempt_state";

export const ExamMode = () => {
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);
    const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [now, setNow] = useState(Date.now());
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

    const finishInProgress = useRef(false);

    const { data: activeExams = [], isLoading: isLoadingExams } = useGetActiveExamsQuery();
    const { data: exercises = [], isLoading: isLoadingExercises } = useGetExercisesQuery();
    const [startExam, { isLoading: isStarting }] = useStartExamMutation();
    const [finishExam] = useFinishExamMutation();
    const [createSolution] = useCreateSolutionMutation();

    const selectedExam = useMemo(
        () => activeExams.find((exam) => exam.id === selectedExamId) ?? null,
        [activeExams, selectedExamId],
    );

    const examExercises = useMemo(
        () =>
            selectedExam
                ? exercises.filter((exercise) => exercise.databaseMetaId === selectedExam.databaseMetaId)
                : [],
        [exercises, selectedExam],
    );

    const { data: myResults } = useGetMyResultsQuery(
        currentAttempt?.examId ?? 0,
        {
            skip: !currentAttempt
        },
    );

    const { data: userExamInfo } = useGetUserExamInfoQuery(selectedExamId ?? skipToken, {
        skip: !selectedExamId,
    });

    const answeredCount = examExercises.filter((exercise) => answers[exercise.id]?.trim()).length;

    const secondsLeft = useMemo(() => {
        if (!currentAttempt || currentAttempt.finishedAt) {
            return selectedExam?.durationMinutes ? selectedExam.durationMinutes * 60 : 0;
        }

        const startTime = new Date(currentAttempt.startedAt).getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const totalSeconds = selectedExam?.durationMinutes ? selectedExam.durationMinutes * 60 : 0;

        return Math.max(totalSeconds - elapsedSeconds, 0);
    }, [currentAttempt, now, selectedExam]);

    useEffect(() => {
        if (isLoadingExams || isLoadingExercises) return;

        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return;

        try {
            const parsed: SavedAttemptState = JSON.parse(savedState);
            const startTime = new Date(parsed.startedAt).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const timeLeft = parsed.durationMinutes * 60 - elapsed;

            if (timeLeft > 0) {
                setSelectedExamId(parsed.examId);
                setSelectedDeploymentId(parsed.deploymentId);
                setCurrentAttempt({
                    id: parsed.attemptId,
                    examId: parsed.examId,
                    userId: 0,
                    selectedDeploymentId: parsed.deploymentId,
                    startedAt: parsed.startedAt,
                    finishedAt: null,
                });
                setAnswers(parsed.answers);
                setNow(Date.now());
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [isLoadingExams, isLoadingExercises]);

    useEffect(() => {
        if (currentAttempt && !currentAttempt.finishedAt && selectedExam) {
            const state: SavedAttemptState = {
                examId: currentAttempt.examId,
                attemptId: currentAttempt.id,
                deploymentId: currentAttempt.selectedDeploymentId,
                startedAt: currentAttempt.startedAt,
                durationMinutes: selectedExam.durationMinutes,
                answers,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [answers, currentAttempt, selectedExam]);

    const handleStartExam = async () => {
        if (!selectedExamId || !selectedDeploymentId) {
            setGeneralError("Выберите СУБД для прохождения контрольной.");
            return;
        }

        try {
            const attempt = await startExam({
                examId: selectedExamId,
                deploymentId: selectedDeploymentId,
            }).unwrap();

            setCurrentAttempt(attempt);
            setAnswers({});
            setGeneralError(null);
            finishInProgress.current = false;
            setNow(Date.now());
        } catch (error) {
            setGeneralError(getApiErrorMessage(error, "Не удалось начать контрольную."));
        }
    };

    const handleFinishExam = async () => {
        if (!currentAttempt || !selectedExam || finishInProgress.current || isSubmittingAnswers) return;

        finishInProgress.current = true;
        setIsSubmittingAnswers(true);
        setGeneralError(null);

        const errors: string[] = [];

        for (const exercise of examExercises) {
            const answer = answers[exercise.id]?.trim();
            if (!answer) continue;

            try {
                await createSolution({
                    exerciseId: exercise.id,
                    deploymentId: currentAttempt.selectedDeploymentId,
                    userAnswer: answer,
                    examId: currentAttempt.examId,
                }).unwrap();
            } catch (error) {
                errors.push(
                    `Задание "${exercise.title}": ${getApiErrorMessage(error, "Не удалось сохранить ответ")}`,
                );
            }
        }

        try {
            await finishExam(currentAttempt.examId).unwrap();
            setCurrentAttempt((prev) => (prev ? { ...prev, finishedAt: new Date().toISOString() } : null));
            localStorage.removeItem(STORAGE_KEY);

            if (errors.length > 0) {
                setGeneralError(`Контрольная завершена, но не все ответы удалось сохранить:\n${errors.join("\n")}`);
            }
        } catch (error) {
            setGeneralError(getApiErrorMessage(error, "Не удалось завершить контрольную."));
        } finally {
            setIsSubmittingAnswers(false);
            finishInProgress.current = false;
        }
    };

    const handleResetExam = () => {
        setSelectedExamId(null);
        setSelectedDeploymentId(null);
        setCurrentAttempt(null);
        setAnswers({});
        setGeneralError(null);
        localStorage.removeItem(STORAGE_KEY);
        finishInProgress.current = false;
    };

    const handleAnswerChange = (exerciseId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [exerciseId]: value }));
    };

    useEffect(() => {
        if (!currentAttempt || currentAttempt.finishedAt) return;

        const intervalId = window.setInterval(() => {
            const currentNow = Date.now();
            setNow(currentNow);

            const startTime = new Date(currentAttempt.startedAt).getTime();
            const elapsed = Math.floor((currentNow - startTime) / 1000);
            const totalSeconds = selectedExam?.durationMinutes ? selectedExam.durationMinutes * 60 : 0;
            const remaining = Math.max(totalSeconds - elapsed, 0);

            if (remaining === 0 && !finishInProgress.current) {
                void handleFinishExam();
            }
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [currentAttempt, selectedExam]);

    if (isLoadingExams || isLoadingExercises) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <p className="text-text/60">Загрузка контрольных работ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(48,102,124,0.18),rgba(70,175,171,0.12),rgba(212,179,104,0.14))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
                    <div>
                        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-text/40">Exam Mode</p>
                        <h1 className="text-3xl font-semibold text-text sm:text-4xl">
                            Контрольные работы, назначенные преподавателем
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-text/65">
                            Выберите доступную контрольную работу, начните её прохождение и отправьте ответы до истечения времени.
                            Результаты появятся после модерации преподавателем.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Доступно КР</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">{activeExams.length}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Заданий</p>
                            <p className="mt-2 text-3xl font-semibold text-secondary">{examExercises.length}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Отвечено</p>
                            <p className="mt-2 text-3xl font-semibold text-accent">{answeredCount}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Таймер</p>
                            <p
                                className={`mt-2 text-3xl font-semibold ${
                                    secondsLeft < 300 && currentAttempt && !currentAttempt.finishedAt
                                        ? "text-red-300"
                                        : "text-text"
                                }`}
                            >
                                {formatSeconds(secondsLeft)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {generalError && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 whitespace-pre-line">
                    {generalError}
                </div>
            )}

            {!currentAttempt && (
                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <p className="text-sm font-medium text-accent">Шаг 1</p>
                            <h2 className="mt-1 text-2xl font-semibold text-text">Выберите контрольную работу</h2>
                            <p className="mt-2 text-sm leading-6 text-text/55">
                                Преподаватель назначил вам доступные контрольные работы.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {activeExams.length === 0 && (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                    Нет доступных контрольных работ.
                                </div>
                            )}

                            {activeExams.map((exam) => {
                                const isActive = exam.id === selectedExamId;

                                return (
                                    <button
                                        key={exam.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedExamId(exam.id);
                                            setSelectedDeploymentId(null);
                                            setGeneralError(null);
                                        }}
                                        className={`w-full rounded-3xl border p-5 text-left transition ${
                                            isActive
                                                ? "border-accent/40 bg-accent/10"
                                                : "border-white/8 bg-black/15 hover:border-white/14 hover:bg-black/20"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className={`text-xl font-semibold ${isActive ? "text-accent" : "text-text"}`}>
                                                        {exam.title}
                                                    </h3>
                                                    {/* ❗ НОВОЕ: Показываем статус контрольной */}
                                                    {exam.isResultsReleased && (
                                                        <span className="rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-medium text-green-300">
                                                            Завершена
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-sm text-text/55">{exam.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {exam.logicalDbName}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {exam.durationMinutes} минут
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {exam.availablePlatforms.length} СУБД
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <p className="text-sm font-medium text-secondary">Шаг 2</p>
                            <h2 className="mt-1 text-2xl font-semibold text-text">
                                {selectedExam?.isResultsReleased ? "Результаты опубликованы" : "Выберите СУБД"}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-text/55">
                                {selectedExam?.isResultsReleased
                                    ? "Контрольная работа завершена. Новые попытки недоступны."
                                    : "Преподаватель разрешил использовать следующие платформы для этой контрольной."}
                            </p>
                        </div>

                        {selectedExam?.isResultsReleased ? (
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-green-500/25 bg-green-500/10 p-6 text-center">
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/30 bg-green-500/20">
                                        <svg className="h-8 w-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-green-200">Контрольная завершена</h3>
                                    <p className="mt-2 text-sm text-green-100/80">
                                        Преподаватель опубликовал результаты. {userExamInfo ? "Вы можете просмотреть свои попытки." : "Загрузка информации..."}
                                    </p>
                                </div>

                                {!userExamInfo ? (
                                    <div className="rounded-2xl border border-white/10 bg-black/15 px-5 py-4 text-center">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                                        <p className="mt-3 text-sm text-text/60">Загрузка информации о попытках...</p>
                                    </div>
                                ) : userExamInfo.usedAttempts === 0 ? (
                                    <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-5 py-4 text-center text-sm text-yellow-300">
                                        У вас нет завершенных попыток для этой контрольной
                                    </div>
                                ) : (
                                    <Link
                                        to={`/exam/${selectedExam.id}/results`}
                                        className="block w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-center font-semibold text-background transition hover:opacity-95"
                                    >
                                        Просмотреть результаты ({userExamInfo.usedAttempts} {userExamInfo.usedAttempts === 1 ? 'попытка' : userExamInfo.usedAttempts < 5 ? 'попытки' : 'попыток'})
                                    </Link>
                                )}
                            </div>
                        ) : selectedExam ? (
                            <>
                                {userExamInfo && (
                                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/15 p-5">
                                        <p className="text-sm font-medium text-text/70">Информация о попытках</p>
                                        <p className="mt-2 text-lg font-semibold text-text">
                                            {userExamInfo.maxAttempts === null
                                                ? "Неограниченно попыток"
                                                : `${userExamInfo.completedAttempts} из ${userExamInfo.maxAttempts} использовано`}
                                        </p>
                                        {userExamInfo.remainingAttempts !== null && (
                                            <p className="mt-1 text-sm text-text/55">
                                                Осталось попыток: {userExamInfo.remainingAttempts}
                                            </p>
                                        )}
                                        {userExamInfo.hasUnfinishedAttempt && (
                                            <p className="mt-3 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
                                                У вас есть незавершенная попытка
                                            </p>
                                        )}
                                        {userExamInfo.usedAttempts > 0 && (
                                            <Link
                                                to={`/exam/${selectedExam.id}/results`}
                                                className="mt-3 block rounded-xl border border-accent/25 bg-accent/10 px-4 py-2 text-center text-sm font-medium text-accent transition hover:bg-accent/15"
                                            >
                                                Посмотреть попытки ({userExamInfo.usedAttempts})
                                            </Link>
                                        )}
                                    </div>
                                )}

                                <div className="mb-5 space-y-3">
                                    {selectedExam.availablePlatforms.map((platform) => {
                                        const isActive = platform.id === selectedDeploymentId;

                                        return (
                                            <button
                                                key={platform.id}
                                                type="button"
                                                onClick={() => setSelectedDeploymentId(platform.id)}
                                                className={`w-full rounded-3xl border p-4 text-left transition ${
                                                    isActive
                                                        ? "border-primary/40 bg-primary/12"
                                                        : "border-white/8 bg-black/15 hover:border-white/12 hover:bg-black/20"
                                                }`}
                                            >
                                                <p className={`text-lg font-semibold ${isActive ? "text-primary" : "text-text"}`}>
                                                    {platform.dbType}
                                                </p>
                                                <p className="mt-1 text-sm text-text/55">{platform.provider}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleStartExam()}
                                    disabled={
                                        !selectedExamId ||
                                        !selectedDeploymentId ||
                                        isStarting ||
                                        (userExamInfo && !userExamInfo.canStart)
                                    }
                                    className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    {isStarting
                                        ? "Начинаем..."
                                        : userExamInfo?.hasUnfinishedAttempt
                                            ? "Продолжить попытку"
                                            : "Начать контрольную"}
                                </button>
                            </>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Сначала выберите контрольную работу слева
                            </div>
                        )}
                    </div>
                </section>
            )}

            {currentAttempt && (
                <section className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-accent">Контрольная запущена</p>
                                    <h2 className="mt-1 text-2xl font-semibold text-text">{selectedExam?.title}</h2>
                                    <p className="mt-2 text-sm leading-6 text-text/55">{selectedExam?.logicalDbName}</p>
                                </div>

                                <div
                                    className={`rounded-3xl border px-5 py-4 text-center ${
                                        currentAttempt.finishedAt
                                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                                            : secondsLeft < 300
                                                ? "border-red-500/30 bg-red-500/10 text-red-300"
                                                : "border-primary/25 bg-primary/10 text-primary"
                                    }`}
                                >
                                    <p className="text-xs uppercase tracking-[0.24em]">Таймер</p>
                                    <p className="mt-2 text-3xl font-semibold">
                                        {currentAttempt.finishedAt ? "Готово" : formatSeconds(secondsLeft)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Всего заданий</p>
                                    <p className="mt-2 text-2xl font-semibold text-text">{examExercises.length}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Отвечено</p>
                                    <p className="mt-2 text-2xl font-semibold text-accent">{answeredCount}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">
                                        {myResults?.isResultsReleased ? "Верно" : "Сдано"}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-secondary">
                                        {myResults?.isResultsReleased
                                            ? myResults.correctAnswers ?? 0
                                            : myResults?.submittedCount ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <h3 className="text-xl font-semibold text-text">Правила</h3>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-text/60">
                                <p>Ответы сохраняются только после завершения контрольной.</p>
                                <p>Пустые задания считаются нерешенными.</p>
                                <p>Результаты станут доступны после проверки преподавателем.</p>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                {!currentAttempt.finishedAt && (
                                    <button
                                        type="button"
                                        onClick={() => void handleFinishExam()}
                                        disabled={isSubmittingAnswers}
                                        className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        {isSubmittingAnswers ? "Завершаем..." : "Завершить контрольную"}
                                    </button>
                                )}

                                {currentAttempt.finishedAt && (
                                    <button
                                        type="button"
                                        onClick={handleResetExam}
                                        className="w-full rounded-2xl border border-white/12 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20"
                                    >
                                        Вернуться к списку
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {currentAttempt.finishedAt && myResults && (
                        <div
                            className={`rounded-[2rem] border p-6 shadow-xl ${
                                myResults.isResultsReleased
                                    ? "border-green-500/25 bg-green-500/10 shadow-green-950/10"
                                    : "border-yellow-500/25 bg-yellow-500/10 shadow-yellow-950/10"
                            }`}
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p
                                        className={`text-sm font-medium ${myResults.isResultsReleased ? "text-green-300" : "text-yellow-300"}`}
                                    >
                                        {myResults.isResultsReleased ? "Результаты опубликованы" : "Ожидание проверки"}
                                    </p>
                                    <h3 className="mt-1 text-3xl font-semibold text-text">
                                        {myResults.isResultsReleased
                                            ? `${myResults.correctAnswers} из ${myResults.totalExercises} правильных`
                                            : myResults.message}
                                    </h3>
                                </div>

                                {myResults.isResultsReleased && (
                                    <div className="rounded-3xl border border-green-500/25 bg-black/20 px-6 py-5 text-center">
                                        <p className="text-xs uppercase tracking-[0.24em] text-green-300">Итог</p>
                                        <p className="mt-2 text-4xl font-semibold text-green-300">
                                            {myResults.totalExercises
                                                ? Math.round(
                                                    ((myResults.correctAnswers ?? 0) / myResults.totalExercises) * 100,
                                                )
                                                : 0}
                                            %
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {examExercises.map((exercise, index) => {
                            const solution = myResults?.solutions?.find((s) => s.exerciseId === exercise.id);

                            return (
                                <article
                                    key={exercise.id}
                                    className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/10"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                    Задание {index + 1}
                                                </span>
                                                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                    {difficultyLabels[exercise.difficulty]}
                                                </span>
                                            </div>
                                            <h3 className="mt-3 text-xl font-semibold text-text">{exercise.title}</h3>
                                        </div>

                                        {currentAttempt.finishedAt && myResults?.isResultsReleased && solution && (
                                            <div
                                                className={`rounded-full px-4 py-2 text-sm font-medium ${
                                                    solution.isCorrect
                                                        ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                        : "border border-red-500/20 bg-red-500/10 text-red-300"
                                                }`}
                                            >
                                                {solution.isCorrect ? "Верно" : "Ошибка"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-medium text-text/70">Ваш SQL-ответ</label>
                                        <textarea
                                            rows={6}
                                            value={answers[exercise.id] ?? ""}
                                            disabled={Boolean(currentAttempt.finishedAt)}
                                            onChange={(event) => handleAnswerChange(exercise.id, event.target.value)}
                                            placeholder="SELECT ..."
                                            className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-70"
                                        />
                                    </div>

                                    {currentAttempt.finishedAt && myResults?.isResultsReleased && solution && (
                                        <div className="mt-4">
                                            <div
                                                className={`rounded-2xl border px-4 py-3 text-sm ${
                                                    solution.isCorrect
                                                        ? "border-green-500/25 bg-green-500/10 text-green-300"
                                                        : "border-red-500/25 bg-red-500/10 text-red-300"
                                                }`}
                                            >
                                                {solution.result ?? (solution.isCorrect ? "Ответ верный!" : "Ответ неверный.")}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};