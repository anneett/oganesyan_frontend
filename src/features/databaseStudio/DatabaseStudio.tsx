import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { API_ORIGIN } from "../../app/baseQuery";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import {
    type CreateDatabaseMetaRequest,
    type DbMetaCreateRequest,
    useCreateDatabaseMetaMutation,
    useCreateDbMetaMutation,
    useDeployDatabaseMutation,
    useGetDatabaseDeploymentsByMetaIdQuery,
    useGetDatabaseMetasQuery,
    useGetDbMetasQuery,
    useTestDbConnectionMutation,
} from "../databaseMetas/databaseMetasApi";
import {
    type ExamCreateRequest,
    useCreateExamMutation,
    useGetActiveExamsQuery,
    useGetExamAttemptsQuery,
    useReleaseResultsMutation,
} from "../exams/examsApi";

type StudioTab = "platforms" | "logical" | "deployments" | "exams";
type NoticeTone = "success" | "error" | "info";

type Notice = {
    tone: NoticeTone;
    text: string;
};

const dbTypeOptions = ["PostgreSQL", "MySQL", "MS SQL Server", "SQLite"] as const;

const tabItems: { id: StudioTab; label: string; subtitle: string }[] = [
    { id: "platforms", label: "СУБД", subtitle: "Регистрация и проверка подключения" },
    { id: "logical", label: "Логические БД", subtitle: "Описание схемы, ERD и SQL-шаблон" },
    { id: "deployments", label: "Развертывания", subtitle: "Связка логической и физической базы" },
    { id: "exams", label: "Контрольные", subtitle: "Назначение КР студентам" },
];

const noticeClasses: Record<NoticeTone, string> = {
    success: "border-green-500/30 bg-green-500/10 text-green-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-accent/30 bg-accent/10 text-accent",
};

const examDurations = [15, 30, 45, 60, 90];

const formatDateTime = (value?: string) => {
    if (!value) {
        return "Еще не развернуто";
    }

    return new Date(value).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const DatabaseStudio = () => {
    const [activeTab, setActiveTab] = useState<StudioTab>("platforms");
    const [selectedMetaId, setSelectedMetaId] = useState<number | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

    const [dbMetaForm, setDbMetaForm] = useState<DbMetaCreateRequest>({
        dbType: dbTypeOptions[0],
        connectionString: "",
    });
    const [logicalForm, setLogicalForm] = useState<CreateDatabaseMetaRequest>({
        logicalName: "",
        description: "",
        createScriptTemplate: "",
        erdImage: null,
    });
    const [deploymentForm, setDeploymentForm] = useState({
        dbMetaId: 0,
        physicalDatabaseName: "",
        executeScript: true,
    });
    const [examForm, setExamForm] = useState<ExamCreateRequest>({
        title: "",
        description: "",
        databaseMetaId: 0,
        durationMinutes: 30,
        deploymentIds: [],
    });

    const [dbNotice, setDbNotice] = useState<Notice | null>(null);
    const [logicalNotice, setLogicalNotice] = useState<Notice | null>(null);
    const [deploymentNotice, setDeploymentNotice] = useState<Notice | null>(null);
    const [examNotice, setExamNotice] = useState<Notice | null>(null);

    const { data: dbMetas = [], isLoading: dbMetasLoading, refetch: refetchDbMetas } = useGetDbMetasQuery();
    const { data: databaseMetas = [], isLoading: databaseMetasLoading, refetch: refetchDatabaseMetas } = useGetDatabaseMetasQuery();
    const { data: activeExams = [], isLoading: examsLoading, refetch: refetchExams } = useGetActiveExamsQuery();

    const effectiveSelectedMetaId = selectedMetaId ?? databaseMetas[0]?.id ?? null;
    const effectiveDbMetaId = deploymentForm.dbMetaId || dbMetas[0]?.id || 0;

    const {
        data: deployments = [],
        isFetching: deploymentsLoading,
        refetch: refetchDeployments,
    } = useGetDatabaseDeploymentsByMetaIdQuery(effectiveSelectedMetaId ?? skipToken);

    const {
        data: examAttempts = [],
        refetch: refetchExamAttempts,
    } = useGetExamAttemptsQuery(selectedExamId ?? skipToken, { skip: !selectedExamId });

    const [createDbMeta, { isLoading: isSavingDbMeta }] = useCreateDbMetaMutation();
    const [testDbConnection, { isLoading: isTestingConnection }] = useTestDbConnectionMutation();
    const [createDatabaseMeta, { isLoading: isSavingLogicalDb }] = useCreateDatabaseMetaMutation();
    const [deployDatabase, { isLoading: isDeploying }] = useDeployDatabaseMutation();
    const [createExam, { isLoading: isCreatingExam }] = useCreateExamMutation();
    const [releaseResults, { isLoading: isReleasingResults }] = useReleaseResultsMutation();

    const selectedMeta = useMemo(
        () => databaseMetas.find((meta) => meta.id === effectiveSelectedMetaId) ?? null,
        [databaseMetas, effectiveSelectedMetaId],
    );

    const selectedExam = useMemo(
        () => activeExams.find((exam) => exam.id === selectedExamId) ?? null,
        [activeExams, selectedExamId],
    );

    const totalDeployments = databaseMetas.reduce((acc, meta) => acc + (meta.deployments?.length ?? 0), 0);
    const deployedCount = databaseMetas.reduce(
        (acc, meta) => acc + (meta.deployments?.filter((item) => item.isDeployed).length ?? 0),
        0,
    );

    const availableDeploymentsForExam = useMemo(() => {
        if (!examForm.databaseMetaId) return [];
        const meta = databaseMetas.find((m) => m.id === examForm.databaseMetaId);
        return meta?.deployments?.filter((d) => d.isDeployed) ?? [];
    }, [examForm.databaseMetaId, databaseMetas]);

    const handleTestConnection = async () => {
        try {
            const result = await testDbConnection(dbMetaForm).unwrap();
            setDbNotice({
                tone: result.success ? "success" : "error",
                text: result.message,
            });
        } catch (error) {
            setDbNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось проверить подключение."),
            });
        }
    };

    const handleCreateDbMeta = async (event: FormEvent) => {
        event.preventDefault();

        try {
            await createDbMeta(dbMetaForm).unwrap();
            setDbNotice({
                tone: "success",
                text: "СУБД успешно зарегистрирована и готова к развертываниям.",
            });
            setDbMetaForm({
                dbType: dbTypeOptions[0],
                connectionString: "",
            });
            await refetchDbMetas();
        } catch (error) {
            setDbNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось сохранить СУБД."),
            });
        }
    };

    const handleCreateLogicalDb = async (event: FormEvent) => {
        event.preventDefault();

        try {
            const result = await createDatabaseMeta(logicalForm).unwrap();
            setLogicalNotice({
                tone: "success",
                text: `Логическая БД «${result.logicalName}» успешно создана.`,
            });
            setLogicalForm({
                logicalName: "",
                description: "",
                createScriptTemplate: "",
                erdImage: null,
            });
            await refetchDatabaseMetas();
        } catch (error) {
            setLogicalNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось создать логическую БД."),
            });
        }
    };

    const handleDeploy = async (event: FormEvent) => {
        event.preventDefault();

        if (!effectiveSelectedMetaId) {
            setDeploymentNotice({
                tone: "error",
                text: "Сначала выберите логическую БД.",
            });
            return;
        }

        try {
            const result = await deployDatabase({
                databaseMetaId: effectiveSelectedMetaId,
                payload: {
                    ...deploymentForm,
                    dbMetaId: effectiveDbMetaId,
                },
            }).unwrap();

            if (result.message) {
                setDeploymentNotice({
                    tone: "info",
                    text: result.message,
                });
            } else {
                setDeploymentNotice({
                    tone: "success",
                    text: `Физическая БД «${result.physicaDatabaseName ?? deploymentForm.physicalDatabaseName}» добавлена в список развертываний.`,
                });
            }

            setDeploymentForm((prev) => ({
                ...prev,
                physicalDatabaseName: "",
                executeScript: true,
            }));

            await Promise.all([refetchDatabaseMetas(), refetchDeployments()]);
        } catch (error) {
            setDeploymentNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось выполнить развертывание."),
            });
        }
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

        try {
            const result = await createExam(examForm).unwrap();
            setExamNotice({
                tone: "success",
                text: `Контрольная работа «${result.title}» создана и доступна студентам.`,
            });
            setExamForm({
                title: "",
                description: "",
                databaseMetaId: 0,
                durationMinutes: 30,
                deploymentIds: [],
            });
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

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
                    <div>
                        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text/40">Database Studio</p>
                        <h1 className="max-w-2xl text-3xl font-semibold text-text sm:text-4xl">
                            Управление СУБД, логическими БД, развертываниями и контрольными в одном окне.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-text/65">
                            Сначала подключаем физические движки, затем описываем учебные схемы, раскатываем их на
                            выбранную платформу и назначаем контрольные работы студентам.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">СУБД</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">{dbMetas.length}</p>
                            <p className="mt-1 text-sm text-text/45">Доступных платформ</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Логические БД</p>
                            <p className="mt-2 text-3xl font-semibold text-secondary">{databaseMetas.length}</p>
                            <p className="mt-1 text-sm text-text/45">Сценариев и схем</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Развертывания</p>
                            <p className="mt-2 text-3xl font-semibold text-accent">{deployedCount}/{totalDeployments}</p>
                            <p className="mt-1 text-sm text-text/45">Активных</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Контрольные</p>
                            <p className="mt-2 text-3xl font-semibold text-green-300">{activeExams.length}</p>
                            <p className="mt-1 text-sm text-text/45">Активных КР</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-6 grid gap-3 md:grid-cols-4">
                {tabItems.map((tab) => {
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-3xl border p-5 text-left transition ${
                                isActive
                                    ? "border-accent/40 bg-accent/12 shadow-lg shadow-accent/10"
                                    : "border-white/8 bg-white/3 hover:border-white/14 hover:bg-white/5"
                            }`}
                        >
                            <p className={`text-lg font-semibold ${isActive ? "text-accent" : "text-text"}`}>{tab.label}</p>
                            <p className="mt-1 text-sm leading-6 text-text/55">{tab.subtitle}</p>
                        </button>
                    );
                })}
            </section>

            {activeTab === "platforms" && (
                <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Добавить СУБД</h2>
                                <p className="mt-1 text-sm text-text/55">Подключение к физическому серверу или локальной базе.</p>
                            </div>
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                Только администратор
                            </span>
                        </div>

                        {dbNotice && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[dbNotice.tone]}`}>
                                {dbNotice.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateDbMeta} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Тип СУБД</label>
                                <select
                                    value={dbMetaForm.dbType}
                                    onChange={(event) =>
                                        setDbMetaForm((prev) => ({ ...prev, dbType: event.target.value }))
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                >
                                    {dbTypeOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Строка подключения</label>
                                <textarea
                                    rows={6}
                                    value={dbMetaForm.connectionString}
                                    onChange={(event) =>
                                        setDbMetaForm((prev) => ({ ...prev, connectionString: event.target.value }))
                                    }
                                    placeholder="Host=localhost;Port=5432;Username=postgres;Password=..."
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                                />
                                <p className="mt-2 text-sm text-text/45">
                                    Для SQLite можно указать файл, для PostgreSQL/MySQL/MSSQL — подключение к серверу.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleTestConnection}
                                    disabled={isTestingConnection || !dbMetaForm.connectionString.trim()}
                                    className="flex-1 rounded-2xl border border-secondary/25 bg-secondary/10 px-5 py-3 font-medium text-secondary transition hover:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isTestingConnection ? "Проверка подключения..." : "Проверить подключение"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingDbMeta || !dbMetaForm.connectionString.trim()}
                                    className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    {isSavingDbMeta ? "Сохранение..." : "Сохранить СУБД"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Зарегистрированные платформы</h2>
                                <p className="mt-1 text-sm text-text/55">Их можно использовать для развертывания учебных баз.</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-text/55">
                                {dbMetas.length} шт.
                            </div>
                        </div>

                        {dbMetasLoading ? (
                            <p className="text-text/55">Загрузка списка СУБД...</p>
                        ) : dbMetas.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Пока нет ни одной зарегистрированной СУБД.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {dbMetas.map((dbMeta) => (
                                    <article key={dbMeta.id} className="rounded-3xl border border-white/8 bg-black/15 p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-semibold text-text">{dbMeta.dbType}</p>
                                                <p className="mt-1 text-sm text-text/45">Провайдер: {dbMeta.provider}</p>
                                            </div>
                                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                                                Готова
                                            </span>
                                        </div>
                                        <p className="mt-4 text-sm leading-6 text-text/55">
                                            Платформа уже доступна в форме развертывания и в режиме контрольной работы.
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {activeTab === "logical" && (
                <section className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-text">Добавить логическую БД</h2>
                            <p className="mt-1 text-sm text-text/55">Название, краткое описание, SQL-шаблон и ERD-картинка.</p>
                        </div>

                        {logicalNotice && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[logicalNotice.tone]}`}>
                                {logicalNotice.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateLogicalDb} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Название</label>
                                <input
                                    type="text"
                                    value={logicalForm.logicalName}
                                    onChange={(event) =>
                                        setLogicalForm((prev) => ({ ...prev, logicalName: event.target.value }))
                                    }
                                    placeholder="Например: Магазин электроники"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Описание</label>
                                <textarea
                                    rows={4}
                                    value={logicalForm.description}
                                    onChange={(event) =>
                                        setLogicalForm((prev) => ({ ...prev, description: event.target.value }))
                                    }
                                    placeholder="Какие сущности есть в схеме и для каких задач она нужна."
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">SQL-шаблон создания</label>
                                <textarea
                                    rows={8}
                                    value={logicalForm.createScriptTemplate}
                                    onChange={(event) =>
                                        setLogicalForm((prev) => ({ ...prev, createScriptTemplate: event.target.value }))
                                    }
                                    placeholder="CREATE TABLE customers (...);"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">ERD-изображение</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setLogicalForm((prev) => ({
                                            ...prev,
                                            erdImage: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-dashed border-white/12 bg-[#0f1720] px-4 py-3 text-sm text-text/60 file:mr-4 file:rounded-xl file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:font-medium file:text-accent"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isSavingLogicalDb ||
                                    !logicalForm.logicalName.trim() ||
                                    !logicalForm.description.trim()
                                }
                                className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {isSavingLogicalDb ? "Создание..." : "Создать логическую БД"}
                            </button>
                        </form>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Каталог логических БД</h2>
                                <p className="mt-1 text-sm text-text/55">Отсюда потом выбираются задания и контрольные.</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-text/55">
                                {databaseMetas.length} шт.
                            </div>
                        </div>

                        {databaseMetasLoading ? (
                            <p className="text-text/55">Загрузка логических БД...</p>
                        ) : databaseMetas.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Логические БД пока не добавлены.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {databaseMetas.map((meta) => (
                                    <article key={meta.id} className="rounded-3xl border border-white/8 bg-black/15 p-5">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="max-w-2xl">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-xl font-semibold text-text">{meta.logicalName}</h3>
                                                    <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                                                        {(meta.deployments?.length ?? 0)} развертываний
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-sm leading-6 text-text/60">{meta.description}</p>
                                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                                        {meta.createScriptTemplate ? "Есть SQL-шаблон" : "Без SQL-шаблона"}
                                                    </span>
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                                        {meta.erdImagePath ? "ERD загружена" : "ERD не загружена"}
                                                    </span>
                                                </div>
                                            </div>

                                            {meta.erdImagePath && (
                                                <a
                                                    href={`${API_ORIGIN}${meta.erdImagePath}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block overflow-hidden rounded-2xl border border-white/10 bg-[#0f1720]"
                                                >
                                                    <img
                                                        src={`${API_ORIGIN}${meta.erdImagePath}`}
                                                        alt={`ERD ${meta.logicalName}`}
                                                        className="h-28 w-44 object-cover"
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {activeTab === "deployments" && (
                <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="mb-5">
                                <h2 className="text-2xl font-semibold text-text">Шаг 1. Выберите логическую БД</h2>
                                <p className="mt-1 text-sm text-text/55">Именно для нее будет выполняться развертывание.</p>
                            </div>

                            <div className="grid gap-3">
                                {databaseMetas.map((meta) => {
                                    const isActive = meta.id === effectiveSelectedMetaId;

                                    return (
                                        <button
                                            key={meta.id}
                                            type="button"
                                            onClick={() => setSelectedMetaId(meta.id)}
                                            className={`rounded-3xl border p-4 text-left transition ${
                                                isActive
                                                    ? "border-accent/40 bg-accent/10"
                                                    : "border-white/8 bg-black/15 hover:border-white/12 hover:bg-black/20"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className={`text-lg font-semibold ${isActive ? "text-accent" : "text-text"}`}>
                                                        {meta.logicalName}
                                                    </p>
                                                    <p className="mt-1 text-sm text-text/55">{meta.description}</p>
                                                </div>
                                                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                    {meta.deployments?.length ?? 0} шт.
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="mb-5">
                                <h2 className="text-2xl font-semibold text-text">Шаг 2. Выполните развертывание</h2>
                                <p className="mt-1 text-sm text-text/55">Выберите платформу, имя физической БД и стратегию запуска.</p>
                            </div>

                            {deploymentNotice && (
                                <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[deploymentNotice.tone]}`}>
                                    {deploymentNotice.text}
                                </div>
                            )}

                            <form onSubmit={handleDeploy} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">СУБД</label>
                                    <select
                                        value={effectiveDbMetaId}
                                        onChange={(event) =>
                                            setDeploymentForm((prev) => ({
                                                ...prev,
                                                dbMetaId: Number(event.target.value),
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                    >
                                        {dbMetas.map((dbMeta) => (
                                            <option key={dbMeta.id} value={dbMeta.id}>
                                                {dbMeta.dbType} ({dbMeta.provider})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-text/70">Имя физической БД</label>
                                    <input
                                        type="text"
                                        value={deploymentForm.physicalDatabaseName}
                                        onChange={(event) =>
                                            setDeploymentForm((prev) => ({
                                                ...prev,
                                                physicalDatabaseName: event.target.value,
                                            }))
                                        }
                                        placeholder="shop_exam_pg"
                                        className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                    />
                                </div>

                                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={deploymentForm.executeScript}
                                        onChange={(event) =>
                                            setDeploymentForm((prev) => ({
                                                ...prev,
                                                executeScript: event.target.checked,
                                            }))
                                        }
                                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-accent"
                                    />
                                    <div>
                                        <p className="font-medium text-text">Сразу выполнить SQL-шаблон</p>
                                        <p className="mt-1 text-sm leading-6 text-text/50">
                                            Если выключить опцию, запись о развертывании создастся, но схема не будет разлита автоматически.
                                        </p>
                                    </div>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isDeploying || !effectiveSelectedMetaId || !deploymentForm.physicalDatabaseName.trim()}
                                    className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    {isDeploying ? "Развертывание..." : "Развернуть физическую БД"}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Текущие развертывания</h2>
                                <p className="mt-1 text-sm text-text/55">
                                    {selectedMeta ? `Для схемы «${selectedMeta.logicalName}»` : "Выберите логическую БД слева"}
                                </p>
                            </div>
                            {selectedMeta && (
                                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-text/55">
                                    {deployments.length} шт.
                                </span>
                            )}
                        </div>

                        {selectedMeta && (
                            <div className="mb-5 rounded-3xl border border-white/8 bg-black/15 p-5">
                                <p className="text-lg font-semibold text-text">{selectedMeta.logicalName}</p>
                                <p className="mt-2 text-sm leading-6 text-text/60">{selectedMeta.description}</p>
                            </div>
                        )}

                        {!selectedMeta ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Выберите логическую БД, чтобы увидеть ее развертывания.
                            </div>
                        ) : deploymentsLoading ? (
                            <p className="text-text/55">Загрузка развертываний...</p>
                        ) : deployments.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center text-text/50">
                                Для этой логической БД пока нет развертываний.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {deployments.map((deployment) => (
                                    <article key={deployment.id} className="rounded-3xl border border-white/8 bg-black/15 p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xl font-semibold text-text">{deployment.physicaDatabaseName}</p>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                            deployment.isDeployed
                                                                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                                : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                        }`}
                                                    >
                                                        {deployment.isDeployed ? "Развернута" : "Только зарегистрирована"}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-text/55">
                                                    {deployment.dbMeta?.dbType ?? "Неизвестная СУБД"} · {deployment.dbMeta?.provider ?? "provider n/a"}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-sm text-text/55">
                                                {formatDateTime(deployment.deployedAt)}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {activeTab === "exams" && (
                <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-text">Создать контрольную работу</h2>
                                <p className="mt-1 text-sm text-text/55">
                                    Выберите логическую БД, доступные СУБД и установите длительность.
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
                                        onChange={(event) =>
                                            setExamForm((prev) => ({ ...prev, title: event.target.value }))
                                        }
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
                                        <label className="mb-3 block text-sm font-medium text-text/70">
                                            Доступные СУБД (выберите минимум одну)
                                        </label>

                                        {availableDeploymentsForExam.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-6 text-center text-sm text-text/50">
                                                Для выбранной логической БД нет развернутых платформ. Создайте развертывание на вкладке «Развертывания».
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableDeploymentsForExam.map((deployment) => {
                                                    const isSelected = examForm.deploymentIds.includes(deployment.id);

                                                    return (
                                                        <label
                                                            key={deployment.id}
                                                            className={`flex items-center gap-3 rounded-2xl border p-4 transition cursor-pointer ${
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
                                        examForm.deploymentIds.length === 0
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
                                                className={`rounded-3xl border p-5 transition cursor-pointer ${
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
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
                                                        <p className="mt-2 text-xs text-text/45">
                                                            Начал: {formatDateTime(attempt.startedAt)}
                                                        </p>
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
            )}
        </div>
    );
};