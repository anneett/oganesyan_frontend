import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useGetExercisesQuery } from "../exercises/exercisesApi";
import { type Solution, useCreateSolutionMutation } from "../solutions/solutionsApi";

type ExamResultMap = Record<number, Solution>;
type ExamErrorMap = Record<number, string>;

type SavedExamState = {
    selectedDeploymentId: number;
    durationMinutes: number;
    startedAt: number;
    answers: Record<number, string>;
};

const STORAGE_KEY = "exam_mode_state";
const examDurations = [15, 30, 45];

const formatSeconds = (seconds: number) => {
    const safeValue = Math.max(seconds, 0);
    const minutes = Math.floor(safeValue / 60).toString().padStart(2, "0");
    const restSeconds = Math.floor(safeValue % 60).toString().padStart(2, "0");
    return `${minutes}:${restSeconds}`;
};

const difficultyLabels = ["Легкая", "Средняя", "Сложная"];

export const ExamMode = () => {
    const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [finishedAt, setFinishedAt] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [results, setResults] = useState<ExamResultMap>({});
    const [resultErrors, setResultErrors] = useState<ExamErrorMap>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [now, setNow] = useState(0);

    const finishInProgress = useRef(false);

    const { data: databaseMetas = [], isLoading: isLoadingDatabases } = useGetDatabaseMetasQuery();
    const { data: exercises = [], isLoading: isLoadingExercises } = useGetExercisesQuery();
    const [createSolution, { isLoading: isSubmitting }] = useCreateSolutionMutation();

    const availableDeployments = useMemo(
        () =>
            databaseMetas.flatMap((meta) =>
                (meta.deployments ?? [])
                    .filter((d) => d.isDeployed)
                    .map((d) => ({
                        ...d,
                        logicalName: meta.logicalName,
                        description: meta.description,
                    })),
            ),
        [databaseMetas],
    );

    const selectedDeployment = useMemo(
        () => availableDeployments.find((d) => d.id === selectedDeploymentId) ?? null,
        [availableDeployments, selectedDeploymentId],
    );

    const examExercises = useMemo(
        () =>
            selectedDeployment
                ? exercises.filter((e) => e.databaseMetaId === selectedDeployment.databaseMetaId)
                : [],
        [exercises, selectedDeployment],
    );

    const answeredCount = examExercises.filter((e) => answers[e.id]?.trim()).length;
    const checkedCount = Object.keys(results).length;
    const correctCount = Object.values(results).filter((r) => r.isCorrect).length;

    const secondsLeft = useMemo(() => {
        if (!startedAt || finishedAt) return durationMinutes * 60;
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        return Math.max(durationMinutes * 60 - elapsedSeconds, 0);
    }, [durationMinutes, finishedAt, now, startedAt]);

    useEffect(() => {
        if (startedAt && !finishedAt && selectedDeploymentId !== null) {
            const state: SavedExamState = {
                selectedDeploymentId,
                durationMinutes,
                startedAt,
                answers,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [answers, durationMinutes, finishedAt, selectedDeploymentId, startedAt]);

    useEffect(() => {
        if (isLoadingDatabases || isLoadingExercises) return;

        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return;

        try {
            const parsed: SavedExamState = JSON.parse(savedState);
            const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
            const timeLeft = parsed.durationMinutes * 60 - elapsed;

            if (timeLeft > 0) {
                setSelectedDeploymentId(parsed.selectedDeploymentId);
                setDurationMinutes(parsed.durationMinutes);
                setStartedAt(parsed.startedAt);
                setAnswers(parsed.answers);
                setNow(Date.now());
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [isLoadingDatabases, isLoadingExercises]);

    const handleStartExam = () => {
        const effectiveDeployment = selectedDeployment ?? availableDeployments[0] ?? null;

        if (!effectiveDeployment || examExercises.length === 0) {
            setGeneralError("Для выбранного развертывания пока нет заданий.");
            return;
        }

        finishInProgress.current = false;
        setSelectedDeploymentId(effectiveDeployment.id);
        setStartedAt(Date.now());
        setFinishedAt(null);
        setAnswers({});
        setResults({});
        setResultErrors({});
        setGeneralError(null);
        setNow(Date.now());
    };

    const handleResetExam = () => {
        finishInProgress.current = false;
        localStorage.removeItem(STORAGE_KEY);
        setStartedAt(null);
        setFinishedAt(null);
        setAnswers({});
        setResults({});
        setResultErrors({});
        setGeneralError(null);
        setNow(Date.now());
    };

    const handleAnswerChange = (exerciseId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [exerciseId]: value }));
    };

    const handleFinishExam = async () => {
        if (!selectedDeployment || !startedAt || finishInProgress.current) return;

        finishInProgress.current = true;
        setGeneralError(null);

        const nextResults: ExamResultMap = { ...results };
        const nextErrors: ExamErrorMap = {};

        for (const exercise of examExercises) {
            const answer = answers[exercise.id]?.trim();
            if (!answer || nextResults[exercise.id]) continue;

            try {
                const result = await createSolution({
                    exerciseId: exercise.id,
                    deploymentId: selectedDeployment.id,
                    userAnswer: answer,
                }).unwrap();
                nextResults[exercise.id] = result;
            } catch (error) {
                nextErrors[exercise.id] = getApiErrorMessage(
                    error,
                    "Не удалось проверить ответ. Попробуйте завершить контрольную еще раз.",
                );
            }
        }

        setResults(nextResults);
        setResultErrors(nextErrors);
        setFinishedAt(Date.now());
        localStorage.removeItem(STORAGE_KEY);

        if (Object.keys(nextErrors).length > 0) {
            setGeneralError("Часть ответов не удалось проверить автоматически. Сообщения показаны у заданий.");
        }

        finishInProgress.current = false;
    };

    const autoFinishExam = useEffectEvent(() => {
        void handleFinishExam();
    });

    useEffect(() => {
        if (!startedAt || finishedAt) return;

        const intervalId = window.setInterval(() => {
            const currentNow = Date.now();
            setNow(currentNow);

            const elapsed = Math.floor((currentNow - startedAt) / 1000);
            const remaining = Math.max(durationMinutes * 60 - elapsed, 0);

            if (remaining === 0 && !finishInProgress.current) {
                autoFinishExam();
            }
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [durationMinutes, finishedAt, startedAt]);

    if (isLoadingDatabases || isLoadingExercises) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <p className="text-text/60">Подготавливаем режим контрольной работы...</p>
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
                            Выберите СУБД, запустите таймер и сдайте контрольную по реальной развернутой базе.
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-text/65">
                            Проверка происходит только после завершения. Система отправляет каждый ответ на бэкенд с
                            нужным `deploymentId`, а затем считает количество правильных решений.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Развертывания</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">{availableDeployments.length}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Заданий в выбранной работе</p>
                            <p className="mt-2 text-3xl font-semibold text-secondary">{examExercises.length}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Отвечено</p>
                            <p className="mt-2 text-3xl font-semibold text-accent">{answeredCount}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Таймер</p>
                            <p className={`mt-2 text-3xl font-semibold ${secondsLeft < 300 && startedAt && !finishedAt ? "text-red-300" : "text-text"}`}>
                                {formatSeconds(secondsLeft)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {generalError && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {generalError}
                </div>
            )}

            {!startedAt && (
                <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <p className="text-sm font-medium text-accent">Шаг 1</p>
                            <h2 className="mt-1 text-2xl font-semibold text-text">Выбор СУБД и развертывания</h2>
                            <p className="mt-2 text-sm leading-6 text-text/55">
                                Для контрольной подходят только полностью развернутые физические БД.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {availableDeployments.length === 0 && (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                    Пока нет развернутых баз. Сначала создайте развертывание в админской панели.
                                </div>
                            )}

                            {availableDeployments.map((deployment) => {
                                const isActive = deployment.id === selectedDeploymentId;
                                const exerciseCount = exercises.filter(
                                    (exercise) => exercise.databaseMetaId === deployment.databaseMetaId,
                                ).length;

                                return (
                                    <button
                                        key={deployment.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDeploymentId(deployment.id);
                                            setGeneralError(null);
                                        }}
                                        className={`w-full rounded-3xl border p-5 text-left transition ${
                                            isActive
                                                ? "border-accent/40 bg-accent/10"
                                                : "border-white/8 bg-black/15 hover:border-white/14 hover:bg-black/20"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className={`text-xl font-semibold ${isActive ? "text-accent" : "text-text"}`}>
                                                        {deployment.dbMeta?.dbType}
                                                    </h3>
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {deployment.physicaDatabaseName}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-text/55">{deployment.logicalName}</p>
                                                <p className="mt-1 text-sm leading-6 text-text/45">{deployment.description}</p>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-right text-sm text-text/55">
                                                <p>{exerciseCount} заданий</p>
                                                <p className="mt-1">{deployment.dbMeta?.provider}</p>
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
                            <h2 className="mt-1 text-2xl font-semibold text-text">Параметры контрольной</h2>
                            <p className="mt-2 text-sm leading-6 text-text/55">
                                После запуска таймер начнет отсчет, а промежуточная проверка будет скрыта до завершения.
                            </p>
                        </div>

                        <div className="mb-6">
                            <p className="mb-3 text-sm font-medium text-text/70">Длительность</p>
                            <div className="grid grid-cols-3 gap-3">
                                {examDurations.map((duration) => {
                                    const isActive = duration === durationMinutes;

                                    return (
                                        <button
                                            key={duration}
                                            type="button"
                                            onClick={() => setDurationMinutes(duration)}
                                            className={`rounded-2xl border px-4 py-4 text-center transition ${
                                                isActive
                                                    ? "border-primary/40 bg-primary/12 text-primary"
                                                    : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                            }`}
                                        >
                                            <p className="text-2xl font-semibold">{duration}</p>
                                            <p className="text-sm">мин</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/8 bg-black/15 p-5">
                            <p className="text-sm font-medium text-text/70">Выбрано</p>
                            <p className="mt-3 text-xl font-semibold text-text">
                                {selectedDeployment
                                    ? `${selectedDeployment.dbMeta?.dbType} · ${selectedDeployment.logicalName}`
                                    : "Развертывание еще не выбрано"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-text/55">
                                {selectedDeployment
                                    ? `Будут выданы все задания, связанные со схемой «${selectedDeployment.logicalName}».`
                                    : "Слева нужно выбрать базу, на которой будет проходить контрольная."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleStartExam}
                            disabled={!selectedDeployment || examExercises.length === 0}
                            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            Начать контрольную
                        </button>
                    </div>
                </section>
            )}

            {startedAt && (
                <section className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-accent">Контрольная запущена</p>
                                    <h2 className="mt-1 text-2xl font-semibold text-text">
                                        {selectedDeployment?.logicalName ?? "Выбранная схема"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-text/55">
                                        {selectedDeployment?.dbMeta?.dbType} · {selectedDeployment?.physicaDatabaseName}
                                    </p>
                                </div>

                                <div className={`rounded-3xl border px-5 py-4 text-center ${
                                    finishedAt
                                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                                        : secondsLeft < 300
                                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                                            : "border-primary/25 bg-primary/10 text-primary"
                                }`}>
                                    <p className="text-xs uppercase tracking-[0.24em]">Таймер</p>
                                    <p className="mt-2 text-3xl font-semibold">{finishedAt ? "Готово" : formatSeconds(secondsLeft)}</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-4">
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Всего заданий</p>
                                    <p className="mt-2 text-2xl font-semibold text-text">{examExercises.length}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Отвечено</p>
                                    <p className="mt-2 text-2xl font-semibold text-accent">{answeredCount}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Проверено</p>
                                    <p className="mt-2 text-2xl font-semibold text-secondary">{checkedCount}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Верно</p>
                                    <p className="mt-2 text-2xl font-semibold text-green-300">{correctCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <h3 className="text-xl font-semibold text-text">Правила</h3>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-text/60">
                                <p>Ответы не показывают результат до завершения контрольной.</p>
                                <p>После нажатия «Завершить» каждый непустой ответ отправляется на проверку.</p>
                                <p>Пустые задания считаются нерешенными и не прибавляют баллы.</p>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                {!finishedAt && (
                                    <button
                                        type="button"
                                        onClick={() => void handleFinishExam()}
                                        disabled={isSubmitting}
                                        className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        {isSubmitting ? "Завершаем и проверяем..." : "Завершить контрольную"}
                                    </button>
                                )}

                                {finishedAt && (
                                    <button
                                        type="button"
                                        onClick={handleResetExam}
                                        className="w-full rounded-2xl border border-white/12 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20"
                                    >
                                        Начать заново
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {finishedAt && (
                        <div className="rounded-[2rem] border border-green-500/25 bg-green-500/10 p-6 shadow-xl shadow-green-950/10">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-300">Результат контрольной</p>
                                    <h3 className="mt-1 text-3xl font-semibold text-text">
                                        {correctCount} из {examExercises.length} правильных ответов
                                    </h3>
                                    <p className="mt-2 text-sm text-text/60">
                                        Проверено {checkedCount} ответов, заполнено {answeredCount} заданий.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-green-500/25 bg-black/20 px-6 py-5 text-center">
                                    <p className="text-xs uppercase tracking-[0.24em] text-green-300">Итог</p>
                                    <p className="mt-2 text-4xl font-semibold text-green-300">
                                        {examExercises.length > 0 ? Math.round((correctCount / examExercises.length) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {examExercises.map((exercise, index) => {
                            const result = results[exercise.id];
                            const resultError = resultErrors[exercise.id];

                            return (
                                <article key={exercise.id} className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/10">
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

                                        {finishedAt && (
                                            <div
                                                className={`rounded-full px-4 py-2 text-sm font-medium ${
                                                    result?.isCorrect
                                                        ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                        : result
                                                            ? "border border-red-500/20 bg-red-500/10 text-red-300"
                                                            : "border border-white/10 bg-black/20 text-text/55"
                                                }`}
                                            >
                                                {result?.isCorrect ? "Верно" : result ? "Ошибка" : "Не отправлено"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-medium text-text/70">Ваш SQL-ответ</label>
                                        <textarea
                                            rows={6}
                                            value={answers[exercise.id] ?? ""}
                                            disabled={Boolean(finishedAt)}
                                            onChange={(event) => handleAnswerChange(exercise.id, event.target.value)}
                                            placeholder="SELECT ..."
                                            className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-70"
                                        />
                                    </div>

                                    {finishedAt && (
                                        <div className="mt-4 space-y-3">
                                            {result && (
                                                <div
                                                    className={`rounded-2xl border px-4 py-3 text-sm ${
                                                        result.isCorrect
                                                            ? "border-green-500/25 bg-green-500/10 text-green-300"
                                                            : "border-red-500/25 bg-red-500/10 text-red-300"
                                                    }`}
                                                >
                                                    {result.result ?? (result.isCorrect ? "Ответ принят." : "Ответ не совпал с эталоном.")}
                                                </div>
                                            )}

                                            {resultError && (
                                                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                                    {resultError}
                                                </div>
                                            )}
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
