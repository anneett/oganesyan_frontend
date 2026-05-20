import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import {
    type ExamCreateRequest,
    useCreateExamMutation,
    useGetAdminAttemptDetailsQuery,
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

const durationPresets = [15, 30, 45, 60, 90];
const attemptsPresets = [1, 2, 3, 5, 10];
const difficultyLabels = ["Легкая", "Средняя", "Сложная"];

export const ExamManagement = () => {
    const [searchParams] = useSearchParams();
    const preselectedDatabaseMetaId = Number(searchParams.get("databaseMetaId") ?? "0");
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [examForm, setExamForm] = useState<ExamCreateRequest>({
        ...initialExamForm,
        databaseMetaId: preselectedDatabaseMetaId > 0 ? preselectedDatabaseMetaId : 0,
    });
    const [examNotice, setExamNotice] = useState<Notice | null>(null);

    const { data: databaseMetas = [] } = useGetDatabaseMetasQuery();
    const { data: activeExams = [], isLoading: examsLoading, refetch: refetchExams } = useGetActiveExamsQuery();
    const { data: exercises = [] } = useGetExercisesQuery();
    const {
        data: examAttempts = [],
        refetch: refetchExamAttempts,
    } = useGetExamAttemptsQuery(selectedExamId ?? skipToken, { skip: !selectedExamId });
    const { data: adminAttemptDetails } = useGetAdminAttemptDetailsQuery(selectedAttemptId ?? skipToken, {
        skip: !selectedAttemptId,
    });

    const [createExam, { isLoading: isCreatingExam }] = useCreateExamMutation();
    const [releaseResults, { isLoading: isReleasingResults }] = useReleaseResultsMutation();

    const selectedExam = useMemo(
        () => activeExams.find((exam) => exam.id === selectedExamId) ?? null,
        [activeExams, selectedExamId],
    );

    const availableDeploymentsForExam = useMemo(() => {
        if (!examForm.databaseMetaId) return [];
        const meta = databaseMetas.find((item) => item.id === examForm.databaseMetaId);
        return meta?.deployments ?? [];
    }, [databaseMetas, examForm.databaseMetaId]);

    const availableExerciseCounts = useMemo(() => {
        if (!examForm.databaseMetaId) return { easy: 0, medium: 0, hard: 0 };

        return exercises.reduce(
            (acc, exercise) => {
                if (exercise.databaseMetaId !== examForm.databaseMetaId) return acc;
                if (exercise.difficulty === 1) acc.easy += 1;
                if (exercise.difficulty === 2) acc.medium += 1;
                if (exercise.difficulty === 3) acc.hard += 1;
                return acc;
            },
            { easy: 0, medium: 0, hard: 0 },
        );
    }, [examForm.databaseMetaId, exercises]);

    const examAvailabilityErrors = useMemo(() => {
        const errors: string[] = [];
        if (examForm.easyCount > availableExerciseCounts.easy)
            errors.push(`Легких заданий доступно ${availableExerciseCounts.easy}, запрошено ${examForm.easyCount}.`);
        if (examForm.mediumCount > availableExerciseCounts.medium)
            errors.push(`Средних заданий доступно ${availableExerciseCounts.medium}, запрошено ${examForm.mediumCount}.`);
        if (examForm.hardCount > availableExerciseCounts.hard)
            errors.push(`Сложных заданий доступно ${availableExerciseCounts.hard}, запрошено ${examForm.hardCount}.`);
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

    const examFormValidationErrors = useMemo(() => {
        const errors: string[] = [];
        if (!examForm.title.trim()) errors.push("Введите название контрольной работы.");
        if (!examForm.databaseMetaId) errors.push("Выберите базу данных.");
        if (availableDeploymentsForExam.length === 0) {
            errors.push("Для выбранной базы данных нет доступных подключений.");
        } else if (examForm.deploymentIds.length === 0) {
            errors.push("Выберите хотя бы одно подключение для контрольной работы.");
        }
        if (examForm.easyCount + examForm.mediumCount + examForm.hardCount === 0) {
            errors.push("Укажите хотя бы одно задание.");
        }
        return errors;
    }, [
        availableDeploymentsForExam.length,
        examForm.databaseMetaId,
        examForm.deploymentIds.length,
        examForm.easyCount,
        examForm.hardCount,
        examForm.mediumCount,
        examForm.title,
    ]);

    useEffect(() => {
        const availableIds = new Set(availableDeploymentsForExam.map((item) => item.id));
        setExamForm((prev) => {
            const nextIds = prev.deploymentIds.filter((id) => availableIds.has(id));
            if (nextIds.length === prev.deploymentIds.length) {
                return prev;
            }
            return { ...prev, deploymentIds: nextIds };
        });
    }, [availableDeploymentsForExam]);

    useEffect(() => {
        if (availableDeploymentsForExam.length === 1) {
            const onlyDeploymentId = availableDeploymentsForExam[0].id;
            setExamForm((prev) =>
                prev.deploymentIds.length === 0
                    ? { ...prev, deploymentIds: [onlyDeploymentId] }
                    : prev,
            );
        }
    }, [availableDeploymentsForExam]);

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
            setExamNotice({ tone: "error", text: "Выберите хотя бы одно развертывание для контрольной." });
            return;
        }

        if (hasExamAvailabilityError) {
            setExamNotice({ tone: "error", text: examAvailabilityErrors.join(" ") });
            return;
        }

        try {
            const result = await createExam(examForm).unwrap();
            setExamNotice({
                tone: "success",
                text: `Контрольная работа «${result.title}» создана и доступна студентам.`,
            });
            setExamForm({
                ...initialExamForm,
                databaseMetaId: preselectedDatabaseMetaId > 0 ? preselectedDatabaseMetaId : 0,
            });
            setIsFormExpanded(false);
            await refetchExams();
        } catch (error) {
            setExamNotice({ tone: "error", text: getApiErrorMessage(error, "Не удалось создать контрольную работу.") });
        }
    };

    const handleReleaseResults = async (examId: number) => {
        try {
            await releaseResults(examId).unwrap();
            setExamNotice({ tone: "success", text: "Результаты опубликованы. Студенты теперь могут их видеть." });
            await Promise.all([refetchExams(), refetchExamAttempts()]);
        } catch (error) {
            setExamNotice({ tone: "error", text: getApiErrorMessage(error, "Не удалось опубликовать результаты.") });
        }
    };

    const isCustomAttempts =
        examForm.maxAttempts !== null &&
        examForm.maxAttempts !== undefined &&
        !attemptsPresets.includes(examForm.maxAttempts);

    const isCustomDuration =
        examForm.durationMinutes > 0 &&
        !durationPresets.includes(examForm.durationMinutes);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
                    <div>
                        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text/40">Exam Management</p>
                        <h1 className="max-w-2xl text-3xl font-semibold text-text sm:text-4xl">
                            Назначение и публикация контрольных работ.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-text/65">
                            Здесь создаются новые контрольные, выбираются доступные СУБД и публикуются результаты после проверки.
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

            <section className="mb-6">
                <button
                    type="button"
                    onClick={() => setIsFormExpanded(!isFormExpanded)}
                    className="w-full rounded-[2rem] border border-white/8 bg-white/4 p-6 text-left shadow-xl shadow-black/15 transition hover:bg-white/6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-text">Создать контрольную работу</h2>
                            <p className="mt-1 text-sm text-text/55">
                                {isFormExpanded ? "Нажмите, чтобы свернуть форму" : "Нажмите, чтобы создать новую контрольную"}
                            </p>
                        </div>
                        <svg
                            className={`h-6 w-6 text-text/70 transition-transform ${isFormExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {isFormExpanded && (
                    <div className="mt-4 rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        {examNotice && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[examNotice.tone]}`}>
                                {examNotice.text}
                            </div>
                        )}

                        {examFormValidationErrors.length > 0 && (
                            <div className="mb-5 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                                {examFormValidationErrors.join(" ")}
                            </div>
                        )}

                        <form onSubmit={handleCreateExam} className="space-y-5">
                            <div className="grid gap-5 lg:grid-cols-2">
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
                                            <option key={meta.id} value={meta.id}>{meta.logicalName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Описание</label>
                                <textarea
                                    rows={2}
                                    value={examForm.description}
                                    onChange={(event) => setExamForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Проверка знаний по темам: SELECT, JOIN, GROUP BY..."
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div className="grid gap-5 lg:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Количество попыток</label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {attemptsPresets.map((count) => {
                                            const isActive = examForm.maxAttempts === count;
                                            return (
                                                <button
                                                    key={count}
                                                    type="button"
                                                    onClick={() => setExamForm((prev) => ({ ...prev, maxAttempts: count }))}
                                                    className={`rounded-2xl border px-3 py-2 text-center transition ${
                                                        isActive
                                                            ? "border-primary/40 bg-primary/12 text-primary"
                                                            : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                                    }`}
                                                >
                                                    <p className="text-lg font-semibold">{count}</p>
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setExamForm((prev) => ({ ...prev, maxAttempts: null }))}
                                            className={`rounded-2xl border px-3 py-2 text-center transition ${
                                                examForm.maxAttempts === null
                                                    ? "border-primary/40 bg-primary/12 text-primary"
                                                    : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                            }`}
                                        >
                                            <p className="text-sm font-semibold">∞</p>
                                        </button>
                                    </div>

                                    <div className="mt-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="999"
                                            placeholder="Или введите своё значение..."
                                            value={isCustomAttempts ? (examForm.maxAttempts ?? "") : ""}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val > 0) {
                                                    setExamForm((prev) => ({ ...prev, maxAttempts: val }));
                                                }
                                            }}
                                            className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-2 text-sm text-text outline-none transition focus:border-accent/50"
                                        />
                                    </div>

                                    <p className="mt-2 text-sm text-text/45">
                                        {examForm.maxAttempts === null
                                            ? "Студент может проходить контрольную неограниченное количество раз"
                                            : `Студент может пройти контрольную ${examForm.maxAttempts} раз(а)`}
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Длительность (минут)</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {durationPresets.map((duration) => {
                                            const isActive = duration === examForm.durationMinutes;
                                            return (
                                                <button
                                                    key={duration}
                                                    type="button"
                                                    onClick={() => setExamForm((prev) => ({ ...prev, durationMinutes: duration }))}
                                                    className={`rounded-2xl border px-3 py-2 text-center transition ${
                                                        isActive
                                                            ? "border-primary/40 bg-primary/12 text-primary"
                                                            : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                                    }`}
                                                >
                                                    <p className="text-lg font-semibold">{duration}</p>
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setExamForm((prev) => ({ ...prev, durationMinutes: 0 }))}
                                            className={`rounded-2xl border px-3 py-2 text-center transition ${
                                                examForm.durationMinutes === 0
                                                    ? "border-primary/40 bg-primary/12 text-primary"
                                                    : "border-white/8 bg-black/15 text-text/70 hover:text-text"
                                            }`}
                                        >
                                            <p className="text-sm font-semibold">∞</p>
                                        </button>
                                    </div>

                                    <div className="mt-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="480"
                                            placeholder="Или введите своё значение в минутах..."
                                            value={isCustomDuration ? examForm.durationMinutes : ""}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val > 0) {
                                                    setExamForm((prev) => ({ ...prev, durationMinutes: val }));
                                                }
                                            }}
                                            className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-2 text-sm text-text outline-none transition focus:border-accent/50"
                                        />
                                    </div>

                                    <p className="mt-2 text-sm text-text/45">
                                        {examForm.durationMinutes === 0
                                            ? "Без ограничения по времени"
                                            : `${examForm.durationMinutes} минут`}
                                    </p>
                                </div>
                            </div>

                            {examForm.databaseMetaId > 0 && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-text/70">
                                            Количество заданий по сложности
                                        </label>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs text-text/50">
                                                    Легких (макс. {availableExerciseCounts.easy})
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={availableExerciseCounts.easy}
                                                    value={examForm.easyCount}
                                                    onChange={(event) =>
                                                        setExamForm((prev) => ({ ...prev, easyCount: Number(event.target.value) }))
                                                    }
                                                    className="w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-text outline-none transition focus:border-accent/50"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs text-text/50">
                                                    Средних (макс. {availableExerciseCounts.medium})
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={availableExerciseCounts.medium}
                                                    value={examForm.mediumCount}
                                                    onChange={(event) =>
                                                        setExamForm((prev) => ({ ...prev, mediumCount: Number(event.target.value) }))
                                                    }
                                                    className="w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-text outline-none transition focus:border-accent/50"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-xs text-text/50">
                                                    Сложных (макс. {availableExerciseCounts.hard})
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={availableExerciseCounts.hard}
                                                    value={examForm.hardCount}
                                                    onChange={(event) =>
                                                        setExamForm((prev) => ({ ...prev, hardCount: Number(event.target.value) }))
                                                    }
                                                    className="w-full rounded-xl border border-white/10 bg-[#0f1720] px-3 py-2 text-text outline-none transition focus:border-accent/50"
                                                />
                                            </div>
                                        </div>

                                        {hasExamAvailabilityError && (
                                            <div className="mt-3 space-y-1 text-sm text-red-300">
                                                {examAvailabilityErrors.map((message) => (
                                                    <p key={message}>{message}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-3 block text-sm font-medium text-text/70">
                                            Доступные СУБД (выберите минимум одну)
                                        </label>

                                        {availableDeploymentsForExam.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-6 text-center text-sm text-text/50">
                                                Для выбранной логической БД нет развернутых платформ.
                                            </div>
                                        ) : (
                                            <div className="grid gap-3 sm:grid-cols-2">
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
                                                                    {deployment.dbMeta?.name ?? "Подключение"} · {deployment.dbMeta?.dbType ?? "СУБД"}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
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
                )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Активные контрольные</h2>
                                <p className="mt-1 text-sm text-text/55">Выберите для просмотра попыток студентов</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-text/55">
                                {activeExams.length} шт.
                            </div>
                        </div>

                        {examsLoading ? (
                            <p className="text-text/55">Загрузка...</p>
                        ) : activeExams.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Пока нет контрольных работ.
                            </div>
                        ) : (
                            <div className="space-y-3">
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
                                            onClick={() => {
                                                setSelectedExamId(isSelected ? null : exam.id);
                                                setSelectedAttemptId(null);
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className={`text-lg font-semibold ${isSelected ? "text-accent" : "text-text"}`}>
                                                        {exam.title}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-text/55">{exam.description}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-text/55">
                                                            {exam.logicalDbName}
                                                        </span>
                                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-text/55">
                                                            {exam.durationMinutes != null ? `${exam.durationMinutes} мин.` : "∞"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                                                    exam.isResultsReleased
                                                        ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                        : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                }`}>
                                                    {exam.isResultsReleased ? "Опубликовано" : "На проверке"}
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
                                                    className="mt-3 w-full rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isReleasingResults ? "Публикация..." : "Опубликовать результаты"}
                                                </button>
                                            )}
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
                                <p className="mt-1 text-sm text-text/55">Для «{selectedExam.title}»</p>
                            </div>

                            {examAttempts.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                    Пока нет попыток.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {examAttempts.map((attempt) => {
                                        const isSelectedAttempt = attempt.id === selectedAttemptId;
                                        const percentage = attempt.totalAnswers > 0
                                            ? Math.round((attempt.correctAnswers / attempt.totalAnswers) * 100)
                                            : 0;

                                        return (
                                            <button
                                                key={attempt.id}
                                                type="button"
                                                onClick={() => setSelectedAttemptId(isSelectedAttempt ? null : attempt.id)}
                                                className={`w-full rounded-3xl border p-4 text-left transition ${
                                                    isSelectedAttempt
                                                        ? "border-accent/40 bg-accent/10"
                                                        : "border-white/8 bg-black/15 hover:border-white/12 hover:bg-black/20"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Link
                                                            to={`/users/${attempt.userId}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="font-semibold text-text transition hover:text-accent"
                                                        >
                                                            {attempt.userName}
                                                        </Link>
                                                        <p className="text-xs text-text/55">@{attempt.userLogin}</p>
                                                        <p className="mt-1 text-xs text-text/45">
                                                            {formatDateTime(attempt.startedAt)}
                                                            {attempt.finishedAt && ` → ${formatDateTime(attempt.finishedAt)}`}
                                                        </p>
                                                    </div>

                                                    <div className="text-center">
                                                        <p className="text-2xl font-semibold text-text">
                                                            {attempt.correctAnswers}/{attempt.totalAnswers}
                                                        </p>
                                                        <p className="text-xs text-text/55">{percentage}%</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="lg:sticky lg:top-6 lg:self-start">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        {!selectedAttemptId ? (
                            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-20 text-center">
                                <p className="text-text/50">
                                    Выберите попытку студента слева, чтобы посмотреть детали и ответы.
                                </p>
                            </div>
                        ) : !adminAttemptDetails ? (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <p className="text-text/50">Загрузка деталей попытки...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-text">Ответы студента</h2>
                                        <p className="mt-1 text-sm text-text/55">
                                            <Link to={`/users/${adminAttemptDetails.userId}`} className="text-accent hover:underline">
                                                {adminAttemptDetails.userName}
                                            </Link>{" "}
                                            (@{adminAttemptDetails.userLogin})
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-center">
                                        <p className="text-xs text-text/50">Результат</p>
                                        <p className="mt-1 text-2xl font-semibold text-text">
                                            {adminAttemptDetails.correctAnswers} / {adminAttemptDetails.totalExercises}
                                        </p>
                                        <p className="text-xs text-text/45">
                                            {adminAttemptDetails.totalExercises > 0
                                                ? Math.round((adminAttemptDetails.correctAnswers / adminAttemptDetails.totalExercises) * 100)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {adminAttemptDetails.solutions.map((solution, index) => (
                                        <article key={solution.exerciseId} className="rounded-3xl border border-white/8 bg-black/15 p-5">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                            Задание {index + 1}
                                                        </span>
                                                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                            {difficultyLabels[solution.difficulty - 1] ?? "Неизвестно"}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-3 text-lg font-semibold text-text">{solution.exerciseTitle}</h3>
                                                </div>

                                                <div
                                                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                                                        !solution.isSubmitted
                                                            ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                            : solution.isCorrect
                                                                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                                : "border border-red-500/20 bg-red-500/10 text-red-300"
                                                    }`}
                                                >
                                                    {!solution.isSubmitted ? "Нет ответа" : solution.isCorrect ? "Верно" : "Ошибка"}
                                                </div>
                                            </div>

                                            {solution.isSubmitted ? (
                                                <>
                                                    <div className="mt-4 rounded-2xl border border-white/8 bg-[#0f1720] px-4 py-3">
                                                        <p className="mb-2 text-sm font-medium text-text/70">Ответ студента:</p>
                                                        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">
                                                            {solution.userAnswer}
                                                        </pre>
                                                    </div>

                                                    {solution.result && (
                                                        <div
                                                            className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                                                                solution.isCorrect
                                                                    ? "border-green-500/25 bg-green-500/10 text-green-300"
                                                                    : "border-red-500/25 bg-red-500/10 text-red-300"
                                                            }`}
                                                        >
                                                            {solution.result}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-text/55">
                                                    Студент не отправил ответ на это задание.
                                                </div>
                                            )}

                                            {!solution.isCorrect && solution.correctAnswer && (
                                                <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                                    <p className="mb-2 text-sm font-medium text-text/70">Правильный ответ:</p>
                                                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">
                                                        {solution.correctAnswer}
                                                    </pre>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
