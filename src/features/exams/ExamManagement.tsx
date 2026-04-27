import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import {
    type ExamCreateRequest,
    useCreateExamMutation,
    useGetActiveExamsQuery,
    useGetExamAttemptsQuery,
    useReleaseResultsMutation,
} from "./examsApi";
import { useGetExercisesQuery } from "../exercises/exercisesApi";

type NoticeTone = "success" | "error" | "info";

type Notice = {
    tone: NoticeTone;
    text: string;
};

const noticeClasses: Record<NoticeTone, string> = {
    success: "border-green-500/30 bg-green-500/10 text-green-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-accent/30 bg-accent/10 text-accent",
};

const examDurations = [15, 30, 45, 60, 90];

const initialExamForm: ExamCreateRequest = {
    title: "",
    description: "",
    databaseMetaId: 0,
    durationMinutes: 30,
    maxAttempts: 1,
    deploymentIds: [],
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
};

const formatDateTime = (value?: string) => {
    if (!value) {
        return "Еще не завершена";
    }

    return new Date(value).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const ExamManagement = () => {
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [examForm, setExamForm] = useState<ExamCreateRequest>(initialExamForm);
    const [examNotice, setExamNotice] = useState<Notice | null>(null);

    const { data: databaseMetas = [] } = useGetDatabaseMetasQuery();
    const { data: activeExams = [], isLoading: examsLoading, refetch: refetchExams } = useGetActiveExamsQuery();
    const { data: exercises = [] } = useGetExercisesQuery();
    const {
        data: examAttempts = [],
        refetch: refetchExamAttempts,
    } = useGetExamAttemptsQuery(selectedExamId ?? skipToken, { skip: !selectedExamId });

    const [createExam, { isLoading: isCreatingExam }] = useCreateExamMutation();
    const [releaseResults, { isLoading: isReleasingResults }] = useReleaseResultsMutation();

    const selectedExam = useMemo(
        () => activeExams.find((exam) => exam.id === selectedExamId) ?? null,
        [activeExams, selectedExamId],
    );

    const availableDeploymentsForExam = useMemo(() => {
        if (!examForm.databaseMetaId) {
            return [];
        }

        const meta = databaseMetas.find((item) => item.id === examForm.databaseMetaId);
        return meta?.deployments?.filter((deployment) => deployment.isDeployed) ?? [];
    }, [databaseMetas, examForm.databaseMetaId]);

    const availableExerciseCounts = useMemo(() => {
        if (!examForm.databaseMetaId) {
            return { easy: 0, medium: 0, hard: 0 };
        }

        return exercises.reduce(
            (acc, exercise) => {
                if (exercise.databaseMetaId !== examForm.databaseMetaId) {
                    return acc;
                }

                if (exercise.difficulty === 0) acc.easy += 1;
                if (exercise.difficulty === 1) acc.medium += 1;
                if (exercise.difficulty === 2) acc.hard += 1;

                return acc;
            },
            { easy: 0, medium: 0, hard: 0 },
        );
    }, [examForm.databaseMetaId, exercises]);

    const examAvailabilityErrors = useMemo(() => {
        const errors: string[] = [];

        if (examForm.easyCount > availableExerciseCounts.easy) {
            errors.push(`Легких заданий доступно ${availableExerciseCounts.easy}, запрошено ${examForm.easyCount}.`);
        }

        if (examForm.mediumCount > availableExerciseCounts.medium) {
            errors.push(`Средних заданий доступно ${availableExerciseCounts.medium}, запрошено ${examForm.mediumCount}.`);
        }

        if (examForm.hardCount > availableExerciseCounts.hard) {
            errors.push(`Сложных заданий доступно ${availableExerciseCounts.hard}, запрошено ${examForm.hardCount}.`);
        }

        return errors;
    }, [
        availableExerciseCounts.easy,
        availableExerciseCounts.hard,
        availableExerciseCounts.medium,
        examForm.easyCount,
        examForm.hardCount,
        examForm.mediumCount,
    ]);

    const hasExamAvailabilityError = examAvailabilityErrors.length > 0;

    const toggleDeploymentSelection = (deploymentId: number) => {
        setExamForm((prev) => {
            const isSelected = prev.deploymentIds.includes(deploymentId);

            return {
                ...prev,
                deploymentIds: isSelected
                    ? prev.deploymentIds.filter((id) => id !== deploymentId)
                    : [...prev.deploymentIds, deploymentId],
            };
        });
    };

    const handleCreateExam = async (event: FormEvent) => {
        event.preventDefault();

        if (examForm.deploymentIds.length === 0) {
            setExamNotice({
                tone: "error",
                text: "Выберите хотя бы одно развертывание для контрольной.",
            });
            return;
        }

        if (hasExamAvailabilityError) {
            setExamNotice({
                tone: "error",
                text: examAvailabilityErrors.join(" "),
            });
            return;
        }

        try {
            const result = await createExam(examForm).unwrap();
            setExamNotice({
                tone: "success",
                text: `Контрольная работа «${result.title}» создана и доступна студентам.`,
            });
            setExamForm(initialExamForm);
            await refetchExams();
        } catch (error) {
            setExamNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось создать контрольную работу."),
            });
        }
    };

    const handleReleaseResults = async (examId: number) => {
        try {
            await releaseResults(examId).unwrap();
            setExamNotice({
                tone: "success",
                text: "Результаты опубликованы. Студенты теперь могут их видеть.",
            });
            await Promise.all([refetchExams(), refetchExamAttempts()]);
        } catch (error) {
            setExamNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось опубликовать результаты."),
            });
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
                    <div>
                        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text/40">Exam Management</p>
                        <h1 className="max-w-2xl text-3xl font-semibold text-text sm:text-4xl">
                            Назначение и публикация контрольных работ в отдельном разделе администрирования.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-text/65">
                            Здесь создаются новые контрольные, выбираются доступные СУБД и публикуются результаты после
                            проверки. Логические базы и развертывания по-прежнему управляются отдельно в Database Studio.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Контрольные</p>
                            <p className="mt-2 text-3xl font-semibold text-green-300">{activeExams.length}</p>
                            <p className="mt-1 text-sm text-text/45">Активных работ</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Логические БД</p>
                            <p className="mt-2 text-3xl font-semibold text-secondary">{databaseMetas.length}</p>
                            <p className="mt-1 text-sm text-text/45">Доступно для выбора</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Легкие</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">{availableExerciseCounts.easy}</p>
                            <p className="mt-1 text-sm text-text/45">По выбранной БД</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Средние / сложные</p>
                            <p className="mt-2 text-3xl font-semibold text-accent">
                                {availableExerciseCounts.medium} / {availableExerciseCounts.hard}
                            </p>
                            <p className="mt-1 text-sm text-text/45">По выбранной БД</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-text">Создать контрольную работу</h2>
                            <p className="mt-1 text-sm text-text/55">
                                Выберите логическую БД, доступные СУБД, количество заданий и длительность.
                            </p>
                        </div>

                        {examNotice && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[examNotice.tone]}`}>
                                {examNotice.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateExam} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Название контрольной</label>
                                <input
                                    type="text"
                                    value={examForm.title}
                                    onChange={(event) => setExamForm((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Контрольная работа №1 по SQL"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Описание</label>
                                <textarea
                                    rows={3}
                                    value={examForm.description}
                                    onChange={(event) =>
                                        setExamForm((prev) => ({ ...prev, description: event.target.value }))
                                    }
                                    placeholder="Проверка знаний по темам: SELECT, JOIN, GROUP BY..."
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Логическая БД</label>
                                <select
                                    value={examForm.databaseMetaId}
                                    onChange={(event) =>
                                        setExamForm((prev) => ({
                                            ...prev,
                                            databaseMetaId: Number(event.target.value),
                                            deploymentIds: [],
                                            easyCount: 0,
                                            mediumCount: 0,
                                            hardCount: 0,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                >
                                    <option value={0}>Выберите логическую БД</option>
                                    {databaseMetas.map((meta) => (
                                        <option key={meta.id} value={meta.id}>
                                            {meta.logicalName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Количество попыток</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {[1, 2, 3, 5, 10].map((count) => {
                                        const isActive = examForm.maxAttempts === count;

                                        return (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => setExamForm((prev) => ({ ...prev, maxAttempts: count }))}
                                                className={`rounded-2xl border px-3 py-3 text-center transition ${
                                                    isActive
                                                        ? "border-primary/40 bg-primary/12 text-primary"
                                                        : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                                }`}
                                            >
                                                <p className="text-xl font-semibold">{count}</p>
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => setExamForm((prev) => ({ ...prev, maxAttempts: null }))}
                                        className={`rounded-2xl border px-3 py-3 text-center transition ${
                                            examForm.maxAttempts === null
                                                ? "border-primary/40 bg-primary/12 text-primary"
                                                : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                        }`}
                                    >
                                        <p className="text-sm font-semibold">∞</p>
                                    </button>
                                </div>
                                <p className="mt-2 text-sm text-text/45">
                                    {examForm.maxAttempts === null
                                        ? "Студент может проходить контрольную неограниченное количество раз"
                                        : `Студент может пройти контрольную ${examForm.maxAttempts} раз(а)`}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Длительность (минут)</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {examDurations.map((duration) => {
                                        const isActive = duration === examForm.durationMinutes;

                                        return (
                                            <button
                                                key={duration}
                                                type="button"
                                                onClick={() =>
                                                    setExamForm((prev) => ({ ...prev, durationMinutes: duration }))
                                                }
                                                className={`rounded-2xl border px-3 py-3 text-center transition ${
                                                    isActive
                                                        ? "border-primary/40 bg-primary/12 text-primary"
                                                        : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                                }`}
                                            >
                                                <p className="text-xl font-semibold">{duration}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {examForm.databaseMetaId > 0 && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">
                                        Количество заданий по сложности
                                    </label>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs text-text/50">Легких</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={Math.max(50, availableExerciseCounts.easy)}
                                                value={examForm.easyCount}
                                                onChange={(event) =>
                                                    setExamForm((prev) => ({ ...prev, easyCount: Number(event.target.value) }))
                                                }
                                                className="w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-text outline-none transition focus:border-accent/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs text-text/50">Средних</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={Math.max(50, availableExerciseCounts.medium)}
                                                value={examForm.mediumCount}
                                                onChange={(event) =>
                                                    setExamForm((prev) => ({ ...prev, mediumCount: Number(event.target.value) }))
                                                }
                                                className="w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-text outline-none transition focus:border-accent/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs text-text/50">Сложных</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={Math.max(50, availableExerciseCounts.hard)}
                                                value={examForm.hardCount}
                                                onChange={(event) =>
                                                    setExamForm((prev) => ({ ...prev, hardCount: Number(event.target.value) }))
                                                }
                                                className="w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-text outline-none transition focus:border-accent/50"
                                            />
                                        </div>
                                    </div>

                                    <p className="mt-2 text-sm text-text/45">
                                        Всего заданий: {examForm.easyCount + examForm.mediumCount + examForm.hardCount}
                                    </p>
                                </div>
                            )}

                            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-text/65">
                                <p>
                                    Доступно по выбранной БД: легких {availableExerciseCounts.easy}, средних{" "}
                                    {availableExerciseCounts.medium}, сложных {availableExerciseCounts.hard}.
                                </p>
                                {hasExamAvailabilityError && (
                                    <div className="mt-3 space-y-1 text-red-300">
                                        {examAvailabilityErrors.map((message) => (
                                            <p key={message}>{message}</p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {examForm.databaseMetaId > 0 && (
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-text/70">
                                        Доступные СУБД (выберите минимум одну)
                                    </label>

                                    {availableDeploymentsForExam.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-6 text-center text-sm text-text/50">
                                            Для выбранной логической БД нет развернутых платформ. Сначала создайте
                                            развертывание в разделе баз данных.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {availableDeploymentsForExam.map((deployment) => {
                                                const isSelected = examForm.deploymentIds.includes(deployment.id);

                                                return (
                                                    <label
                                                        key={deployment.id}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                                                            isSelected
                                                                ? "border-accent/40 bg-accent/10"
                                                                : "border-white/10 bg-[#0f1720] hover:border-white/20"
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleDeploymentSelection(deployment.id)}
                                                            className="h-4 w-4 rounded border-white/20 bg-transparent text-accent"
                                                        />
                                                        <div className="flex-1">
                                                            <p className={`font-medium ${isSelected ? "text-accent" : "text-text"}`}>
                                                                {deployment.dbMeta?.dbType} · {deployment.physicaDatabaseName}
                                                            </p>
                                                            <p className="mt-1 text-sm text-text/55">
                                                                {deployment.dbMeta?.provider}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    isCreatingExam ||
                                    !examForm.title.trim() ||
                                    !examForm.databaseMetaId ||
                                    examForm.deploymentIds.length === 0 ||
                                    examForm.easyCount + examForm.mediumCount + examForm.hardCount === 0 ||
                                    hasExamAvailabilityError
                                }
                                className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {isCreatingExam ? "Создание..." : "Создать контрольную работу"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Активные контрольные работы</h2>
                                <p className="mt-1 text-sm text-text/55">Доступные студентам для прохождения.</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-text/55">
                                {activeExams.length} шт.
                            </div>
                        </div>

                        {examsLoading ? (
                            <p className="text-text/55">Загрузка контрольных работ...</p>
                        ) : activeExams.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Пока нет ни одной контрольной работы.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeExams.map((exam) => {
                                    const isSelected = exam.id === selectedExamId;

                                    return (
                                        <article
                                            key={exam.id}
                                            className={`cursor-pointer rounded-3xl border p-5 transition ${
                                                isSelected
                                                    ? "border-accent/40 bg-accent/10"
                                                    : "border-white/8 bg-black/15 hover:border-white/12 hover:bg-black/20"
                                            }`}
                                            onClick={() => setSelectedExamId(exam.id)}
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className={`text-xl font-semibold ${isSelected ? "text-accent" : "text-text"}`}>
                                                            {exam.title}
                                                        </h3>
                                                        <p className="mt-2 text-sm text-text/55">{exam.description}</p>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                            exam.isResultsReleased
                                                                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                                : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                        }`}
                                                    >
                                                        {exam.isResultsReleased ? "Опубликовано" : "На проверке"}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                                        {exam.logicalDbName}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                                        {exam.durationMinutes} минут
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                                        {exam.availablePlatforms.length} СУБД
                                                    </span>
                                                </div>

                                                {!exam.isResultsReleased && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            void handleReleaseResults(exam.id);
                                                        }}
                                                        disabled={isReleasingResults}
                                                        className="mt-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isReleasingResults ? "Публикация..." : "Опубликовать результаты"}
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {selectedExam && (
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-text">Попытки студентов</h2>
                                <p className="mt-1 text-sm text-text/55">Для контрольной «{selectedExam.title}»</p>
                            </div>

                            {examAttempts.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                    Пока никто не начинал эту контрольную.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {examAttempts.map((attempt) => (
                                        <article key={attempt.id} className="rounded-3xl border border-white/8 bg-black/15 p-5">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-lg font-semibold text-text">{attempt.userName}</p>
                                                    <p className="mt-1 text-sm text-text/55">@{attempt.userLogin}</p>
                                                    <p className="mt-2 text-xs text-text/45">Начал: {formatDateTime(attempt.startedAt)}</p>
                                                    {attempt.finishedAt && (
                                                        <p className="text-xs text-text/45">
                                                            Завершил: {formatDateTime(attempt.finishedAt)}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-[#0f1720] px-5 py-4 text-center">
                                                    <p className="text-sm text-text/55">Результат</p>
                                                    <p className="mt-1 text-2xl font-semibold text-text">
                                                        {attempt.correctAnswers} / {attempt.totalAnswers}
                                                    </p>
                                                    <p className="mt-1 text-xs text-text/45">
                                                        {attempt.totalAnswers > 0
                                                            ? Math.round((attempt.correctAnswers / attempt.totalAnswers) * 100)
                                                            : 0}
                                                        %
                                                    </p>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
