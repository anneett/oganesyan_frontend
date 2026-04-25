import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { API_ORIGIN } from "../../app/baseQuery";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetaByIdQuery } from "../databaseMetas/databaseMetasApi";
import {
    type ExamAttempt,
    useFinishExamMutation,
    useGetActiveExamsQuery,
    useGetAttemptExercisesQuery,
    useGetMyResultsQuery,
    useGetUserExamInfoQuery,
    useStartExamMutation,
} from "./examsApi";
import { useCreateSolutionMutation } from "../solutions/solutionsApi";

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

const getAssetUrl = (path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith("/") ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`;
};

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
    const [startExam, { isLoading: isStarting }] = useStartExamMutation();
    const [finishExam] = useFinishExamMutation();
    const [createSolution] = useCreateSolutionMutation();

    const selectedExam = useMemo(
        () => activeExams.find((exam) => exam.id === selectedExamId) ?? null,
        [activeExams, selectedExamId],
    );

    const { data: selectedDbMeta } = useGetDatabaseMetaByIdQuery(selectedExam?.databaseMetaId ?? skipToken);
    const erdImageUrl = getAssetUrl(selectedDbMeta?.erdImagePath);

    const {
        data: attemptExercises = [],
        isLoading: isLoadingAttemptExercises,
    } = useGetAttemptExercisesQuery(currentAttempt?.id ?? 0, {
        skip: !currentAttempt,
    });

    const examExercises = currentAttempt ? attemptExercises : [];
    const totalExercisesCount = currentAttempt ? examExercises.length : selectedExam?.totalExercises ?? 0;
    const answeredCount = examExercises.filter((exercise) => answers[exercise.id]?.trim()).length;

    const { data: myResults } = useGetMyResultsQuery(currentAttempt?.examId ?? 0, {
        skip: !currentAttempt,
    });

    const { data: userExamInfo } = useGetUserExamInfoQuery(selectedExamId ?? skipToken, {
        skip: !selectedExamId,
    });

    const submittedSolutionsCount = myResults?.solutions?.length ?? myResults?.submittedCount ?? 0;
    const correctAnswersCount = myResults?.correctAnswers ?? 0;
    const unresolvedAfterFinish = currentAttempt?.finishedAt
        ? Math.max(totalExercisesCount - submittedSolutionsCount, 0)
        : Math.max(totalExercisesCount - answeredCount, 0);

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
        if (isLoadingExams) return;

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
    }, [isLoadingExams]);

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
        } catch (requestError) {
            setGeneralError(getApiErrorMessage(requestError, "Не удалось начать контрольную."));
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
            } catch (requestError) {
                errors.push(
                    `Задание "${exercise.title}": ${getApiErrorMessage(requestError, "Не удалось сохранить ответ")}`,
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
        } catch (requestError) {
            setGeneralError(getApiErrorMessage(requestError, "Не удалось завершить контрольную."));
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

    if (isLoadingExams) {
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
                            Выберите доступную контрольную, начните попытку и отправьте ответы до истечения времени.
                            Если результаты еще не опубликованы, после завершения вы увидите подтверждение, что ответы сохранены и ожидают проверки.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Доступно КР</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">{activeExams.length}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Заданий</p>
                            <p className="mt-2 text-3xl font-semibold text-secondary">{totalExercisesCount}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">{currentAttempt?.finishedAt ? "Сдано" : "Заполнено"}</p>
                            <p className="mt-2 text-3xl font-semibold text-accent">
                                {currentAttempt?.finishedAt ? submittedSolutionsCount : answeredCount}
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Таймер</p>
                            <p
                                className={`mt-2 text-3xl font-semibold ${
                                    secondsLeft < 300 && currentAttempt && !currentAttempt.finishedAt ? "text-red-300" : "text-text"
                                }`}
                            >
                                {formatSeconds(secondsLeft)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {currentAttempt && isLoadingAttemptExercises && (
                <div className="mb-6 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-center text-sm text-accent">
                    Загружаем задания попытки...
                </div>
            )}

            {generalError && (
                <div className="mb-6 whitespace-pre-line rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className={`text-xl font-semibold ${isActive ? "text-accent" : "text-text"}`}>
                                                    {exam.title}
                                                </h3>
                                                <p className="mt-2 text-sm text-text/55">{exam.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {exam.logicalDbName}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {exam.durationMinutes} минут
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {exam.totalExercises} заданий
                                                    </span>
                                                </div>
                                            </div>
                                            {exam.isResultsReleased && (
                                                <span className="rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-medium text-green-300">
                                                    Проверена
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="mb-6">
                                <p className="text-sm font-medium text-secondary">Шаг 2</p>
                                <h2 className="mt-1 text-2xl font-semibold text-text">
                                    {selectedExam ? "Выберите СУБД" : "Детали контрольной"}
                                </h2>
                            </div>

                            {selectedExam ? (
                                <>
                                    <div className="mb-5 rounded-3xl border border-white/8 bg-black/15 p-4">
                                        <p className="text-sm text-text/50">Логическая БД</p>
                                        <p className="mt-1 text-lg font-semibold text-text">{selectedExam.logicalDbName}</p>
                                        <p className="mt-2 text-sm text-text/55">
                                            Легких: {selectedExam.easyCount}, средних: {selectedExam.mediumCount}, сложных: {selectedExam.hardCount}.
                                        </p>
                                    </div>

                                    {userExamInfo && (
                                        <div className="mb-5 rounded-3xl border border-white/8 bg-black/15 p-4">
                                            <p className="text-sm text-text/50">Попытки</p>
                                            <p className="mt-1 text-lg font-semibold text-text">
                                                {userExamInfo.maxAttempts === null
                                                    ? "Количество попыток не ограничено"
                                                    : `${userExamInfo.completedAttempts} из ${userExamInfo.maxAttempts} использовано`}
                                            </p>
                                            {userExamInfo.remainingAttempts !== null && (
                                                <p className="mt-1 text-sm text-text/55">
                                                    Осталось попыток: {userExamInfo.remainingAttempts}
                                                </p>
                                            )}
                                            {userExamInfo.hasUnfinishedAttempt && (
                                                <p className="mt-3 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
                                                    У вас есть незавершенная попытка. Можно продолжить ее на выбранной СУБД.
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
                                            Boolean(userExamInfo && !userExamInfo.canStart)
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
                                    Сначала выберите контрольную работу слева.
                                </div>
                            )}
                        </div>

                        {selectedExam && (
                            <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                                <h3 className="text-xl font-semibold text-text">Схема логической БД</h3>
                                <p className="mt-1 text-sm text-text/55">{selectedExam.logicalDbName}</p>
                                {erdImageUrl ? (
                                    <a href={erdImageUrl} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-3xl border border-white/10 bg-black/15">
                                        <img src={erdImageUrl} alt={`ERD ${selectedExam.logicalDbName}`} className="max-h-[420px] w-full object-contain bg-[#0f1720]" />
                                    </a>
                                ) : (
                                    <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                        Для этой базы пока не загружена ERD-диаграмма.
                                    </div>
                                )}
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
                                    <p className="text-sm font-medium text-accent">
                                        {currentAttempt.finishedAt ? "Контрольная завершена" : "Контрольная запущена"}
                                    </p>
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

                            <div className="mt-6 grid gap-4 sm:grid-cols-4">
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Всего заданий</p>
                                    <p className="mt-2 text-2xl font-semibold text-text">{totalExercisesCount}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">{currentAttempt.finishedAt ? "Сдано" : "Заполнено"}</p>
                                    <p className="mt-2 text-2xl font-semibold text-accent">
                                        {currentAttempt.finishedAt ? submittedSolutionsCount : answeredCount}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">{myResults?.isResultsReleased ? "Верно" : "Ожидает проверки"}</p>
                                    <p className="mt-2 text-2xl font-semibold text-secondary">
                                        {myResults?.isResultsReleased ? correctAnswersCount : submittedSolutionsCount}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">{currentAttempt.finishedAt ? "Нерешено" : "Осталось"}</p>
                                    <p className="mt-2 text-2xl font-semibold text-text">{unresolvedAfterFinish}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                                <h3 className="text-xl font-semibold text-text">Правила</h3>
                                <div className="mt-4 space-y-3 text-sm leading-6 text-text/60">
                                    <p>Пустые поля считаются нерешенными заданиями.</p>
                                    <p>Ответы отправляются при завершении контрольной или автоматически по таймеру.</p>
                                    <p>После проверки преподавателем откроются правильные и неверные ответы.</p>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                                <h3 className="text-xl font-semibold text-text">Схема БД</h3>
                                <p className="mt-1 text-sm text-text/55">{selectedExam?.logicalDbName}</p>
                                {erdImageUrl ? (
                                    <a href={erdImageUrl} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-3xl border border-white/10 bg-black/15">
                                        <img src={erdImageUrl} alt={`ERD ${selectedExam?.logicalDbName ?? "database"}`} className="max-h-[360px] w-full object-contain bg-[#0f1720]" />
                                    </a>
                                ) : (
                                    <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                        Для этой базы пока не загружена ERD-диаграмма.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {currentAttempt.finishedAt && (
                        <div
                            className={`rounded-[2rem] border p-6 shadow-xl ${
                                myResults?.isResultsReleased
                                    ? "border-green-500/25 bg-green-500/10 shadow-green-950/10"
                                    : "border-yellow-500/25 bg-yellow-500/10 shadow-yellow-950/10"
                            }`}
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${myResults?.isResultsReleased ? "text-green-300" : "text-yellow-300"}`}>
                                        {myResults?.isResultsReleased ? "Результаты опубликованы" : "Контрольная отправлена"}
                                    </p>
                                    <h3 className="mt-1 text-3xl font-semibold text-text">
                                        {myResults?.isResultsReleased
                                            ? `${correctAnswersCount} из ${totalExercisesCount} правильных`
                                            : myResults?.message ?? "Ответы сохранены и ожидают проверки преподавателем."}
                                    </h3>
                                    {!myResults?.isResultsReleased && (
                                        <p className="mt-3 text-sm text-text/65">
                                            Отправлено ответов: {submittedSolutionsCount} из {totalExercisesCount}. Нерешенных заданий: {unresolvedAfterFinish}.
                                        </p>
                                    )}
                                </div>

                                {myResults?.isResultsReleased && (
                                    <div className="rounded-3xl border border-green-500/25 bg-black/20 px-6 py-5 text-center">
                                        <p className="text-xs uppercase tracking-[0.24em] text-green-300">Итог</p>
                                        <p className="mt-2 text-4xl font-semibold text-green-300">
                                            {totalExercisesCount ? Math.round((correctAnswersCount / totalExercisesCount) * 100) : 0}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isLoadingAttemptExercises && (
                        <div className="space-y-4">
                            {examExercises.map((exercise, index) => {
                                const solution = myResults?.solutions?.find((item) => item.exerciseId === exercise.id);
                                const isAnswered = Boolean((currentAttempt.finishedAt ? solution?.userAnswer : answers[exercise.id])?.trim());

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
                                                        {difficultyLabels[exercise.difficulty] ?? difficultyLabels[0]}
                                                    </span>
                                                </div>
                                                <h3 className="mt-3 text-xl font-semibold text-text">{exercise.title}</h3>
                                            </div>

                                            <div
                                                className={`rounded-full px-4 py-2 text-sm font-medium ${
                                                    !currentAttempt.finishedAt
                                                        ? isAnswered
                                                            ? "border border-accent/20 bg-accent/10 text-accent"
                                                            : "border border-white/10 bg-black/20 text-text/55"
                                                        : !solution
                                                            ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                            : solution.isCorrect
                                                                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                                : "border border-red-500/20 bg-red-500/10 text-red-300"
                                                }`}
                                            >
                                                {!currentAttempt.finishedAt
                                                    ? isAnswered
                                                        ? "Заполнено"
                                                        : "Нет ответа"
                                                    : !solution
                                                        ? "Не решено"
                                                        : solution.isCorrect
                                                            ? "Верно"
                                                            : "Ошибка"}
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <label className="mb-2 block text-sm font-medium text-text/70">Ваш SQL-ответ</label>
                                            <textarea
                                                rows={6}
                                                value={currentAttempt.finishedAt ? solution?.userAnswer ?? "" : answers[exercise.id] ?? ""}
                                                disabled={Boolean(currentAttempt.finishedAt)}
                                                onChange={(event) => handleAnswerChange(exercise.id, event.target.value)}
                                                placeholder="SELECT ..."
                                                className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-70"
                                            />
                                        </div>

                                        {currentAttempt.finishedAt && myResults?.isResultsReleased && solution?.result && (
                                            <div
                                                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                                                    solution.isCorrect
                                                        ? "border-green-500/25 bg-green-500/10 text-green-300"
                                                        : "border-red-500/25 bg-red-500/10 text-red-300"
                                                }`}
                                            >
                                                {solution.result}
                                            </div>
                                        )}

                                        {currentAttempt.finishedAt && myResults?.isResultsReleased && solution && !solution.isCorrect && (
                                            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                                <p className="mb-2 text-sm font-medium text-text/70">Правильный ответ</p>
                                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">
                                                    {exercise.correctAnswer}
                                                </pre>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        {!currentAttempt.finishedAt ? (
                            <button
                                type="button"
                                onClick={() => void handleFinishExam()}
                                disabled={isSubmittingAnswers}
                                className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {isSubmittingAnswers ? "Завершаем..." : "Завершить контрольную"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResetExam}
                                className="w-full rounded-2xl border border-white/12 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20"
                            >
                                Вернуться к списку
                            </button>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};
