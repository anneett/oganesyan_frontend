import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { API_ORIGIN } from "../../app/baseQuery";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import {
    type CreateDatabaseMetaRequest,
    type DatabaseMeta,
    type DbMeta,
    type DbMetaCreateRequest,
    type DbMetaUpdateRequest,
    useCreateDatabaseMetaMutation,
    useCreateDbMetaMutation,
    useGetDatabaseMetasQuery,
    useGetDbMetasQuery,
    useTestDbConnectionMutation,
    useUpdateDatabaseMetaMutation,
    useUpdateDbMetaMutation,
} from "../databaseMetas/databaseMetasApi";
import { useSearchParams } from "react-router-dom";

type StudioTab = "connections" | "databases";
type NoticeTone = "success" | "error" | "info";

type Notice = {
    tone: NoticeTone;
    text: string;
};

const dbTypeOptions = ["PostgreSQL", "MySQL", "MS SQL Server", "SQLite"] as const;
const connectionStringTemplates: Record<string, { example: string; url: string; description: string }> = {
    "PostgreSQL": {
        example: "Host=localhost;Port=5432;Database=mydb;Username=postgres;Password=mypassword;",
        url: "https://www.connectionstrings.com/postgresql/",
        description: "Npgsql (.NET) или стандартный формат PostgreSQL"
    },
    "MySQL": {
        example: "Server=localhost;Database=mydb;Uid=root;Pwd=mypassword;",
        url: "https://www.connectionstrings.com/mysql/",
        description: "MySQL Connector/Net или стандартный формат MySQL"
    },
    "MS SQL Server": {
        example: "Server=localhost;Database=mydb;User Id=sa;Password=mypassword;",
        url: "https://www.connectionstrings.com/sql-server/",
        description: "SQL Server стандартное подключение"
    },
    "SQLite": {
        example: "Data Source=C:\\path\\to\\database.db;Version=3;",
        url: "https://www.connectionstrings.com/sqlite/",
        description: "Локальный файл базы данных SQLite"
    }
};

const tabItems: { id: StudioTab; label: string; subtitle: string }[] = [
    { id: "connections", label: "Подключения", subtitle: "Серверы и connection string" },
    { id: "databases", label: "Базы данных", subtitle: "Логические БД и привязанные подключения" },
];

const noticeClasses: Record<NoticeTone, string> = {
    success: "border-green-500/30 bg-green-500/10 text-green-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-accent/30 bg-accent/10 text-accent",
};

const getAssetUrl = (path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith("/") ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`;
};

const formatDateTime = (value?: string) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const DatabaseStudio = () => {
    const [editingConnectionId, setEditingConnectionId] = useState<number | null>(null);
    const [editingDatabaseId, setEditingDatabaseId] = useState<number | null>(null);

    const [connectionForm, setConnectionForm] = useState<DbMetaCreateRequest>({
        name: "",
        dbType: dbTypeOptions[0],
        connectionString: "",
    });
    const [databaseForm, setDatabaseForm] = useState<CreateDatabaseMetaRequest>({
        logicalName: "",
        physicalName: "",
        description: "",
        connectionIds: [],
        erdImage: null,
    });

    const [connectionNotice, setConnectionNotice] = useState<Notice | null>(null);
    const [databaseNotice, setDatabaseNotice] = useState<Notice | null>(null);

    const { data: connections = [], isLoading: connectionsLoading } = useGetDbMetasQuery();
    const { data: databases = [], isLoading: databasesLoading } = useGetDatabaseMetasQuery();

    const [createDbMeta, { isLoading: isCreatingConnection }] = useCreateDbMetaMutation();
    const [updateDbMeta, { isLoading: isUpdatingConnection }] = useUpdateDbMetaMutation();
    const [testDbConnection, { isLoading: isTestingConnection }] = useTestDbConnectionMutation();
    const [createDatabaseMeta, { isLoading: isCreatingDatabase }] = useCreateDatabaseMetaMutation();
    const [updateDatabaseMeta, { isLoading: isUpdatingDatabase }] = useUpdateDatabaseMetaMutation();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = (searchParams.get("tab") as StudioTab) || "connections";

    const stats = useMemo(
        () => ({
            totalConnections: connections.length,
            totalDatabases: databases.length,
            totalLinks: databases.reduce((sum, item) => sum + item.deployments.length, 0),
            withErd: databases.filter((item) => item.erdImagePath).length,
        }),
        [connections, databases],
    );

    const resetConnectionForm = () => {
        setEditingConnectionId(null);
        setConnectionForm({
            name: "",
            dbType: dbTypeOptions[0],
            connectionString: "",
        });
    };

    const resetDatabaseForm = () => {
        setEditingDatabaseId(null);
        setDatabaseForm({
            logicalName: "",
            physicalName: "",
            description: "",
            connectionIds: [],
            erdImage: null,
        });
    };

    const handleTestConnection = async () => {
        try {
            const result = await testDbConnection(connectionForm).unwrap();
            setConnectionNotice({
                tone: result.success ? "success" : "error",
                text: result.message,
            });
        } catch (error) {
            setConnectionNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось проверить подключение."),
            });
        }
    };

    const handleConnectionSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            if (editingConnectionId) {
                await updateDbMeta({
                    id: editingConnectionId,
                    payload: connectionForm as DbMetaUpdateRequest,
                }).unwrap();
                setConnectionNotice({ tone: "success", text: "Подключение обновлено." });
            } else {
                await createDbMeta(connectionForm).unwrap();
                setConnectionNotice({ tone: "success", text: "Подключение создано." });
            }
            resetConnectionForm();
        } catch (error) {
            setConnectionNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось сохранить подключение."),
            });
        }
    };

    const handleDatabaseSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            if (editingDatabaseId) {
                await updateDatabaseMeta({
                    id: editingDatabaseId,
                    payload: {
                        ...databaseForm,
                        removeErdImage: false,
                    },
                }).unwrap();
                setDatabaseNotice({ tone: "success", text: "База данных обновлена." });
            } else {
                await createDatabaseMeta(databaseForm).unwrap();
                setDatabaseNotice({ tone: "success", text: "База данных создана." });
            }
            resetDatabaseForm();
        } catch (error) {
            setDatabaseNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось сохранить базу данных."),
            });
        }
    };

    const beginEditConnection = (connection: DbMeta) => {
        setSearchParams({ tab: "connections" });
        setEditingConnectionId(connection.id);
        setConnectionForm({
            name: connection.name,
            dbType: connection.dbType,
            connectionString: "",
        });
        setConnectionNotice({
            tone: "info",
            text: "Оставьте connection string пустым, если не нужно менять его значение.",
        });
    };

    const beginEditDatabase = (database: DatabaseMeta) => {
        setSearchParams({ tab: "databases" });
        setEditingDatabaseId(database.id);
        setDatabaseForm({
            logicalName: database.logicalName,
            physicalName: database.physicalName,
            description: database.description,
            connectionIds: database.deployments.map((item) => item.dbMetaId),
            erdImage: null,
        });
        setDatabaseNotice({
            tone: "info",
            text: "Можно изменить все параметры базы данных.",
        });
    };

    const toggleConnectionSelection = (connectionId: number) => {
        setDatabaseForm((prev) => ({
            ...prev,
            connectionIds: prev.connectionIds.includes(connectionId)
                ? prev.connectionIds.filter((id) => id !== connectionId)
                : [...prev.connectionIds, connectionId],
        }));
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
                    <div>
                        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text/40">Database Studio</p>
                        <h1 className="max-w-3xl text-3xl font-semibold text-text sm:text-4xl">
                            Подключения к серверам и учебные базы данных в одном месте.
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-text/65">
                            Сначала регистрируем подключения к серверам, затем создаем логические базы данных,
                            указываем их физическое имя и отмечаем, на каких подключениях они доступны студентам и преподавателю.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Подключения</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">{stats.totalConnections}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Базы данных</p>
                            <p className="mt-2 text-3xl font-semibold text-secondary">{stats.totalDatabases}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">Привязок</p>
                            <p className="mt-2 text-3xl font-semibold text-accent">{stats.totalLinks}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                            <p className="text-sm text-text/50">ERD-схем</p>
                            <p className="mt-2 text-3xl font-semibold text-green-300">{stats.withErd}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-6 grid gap-3 md:grid-cols-2">
                {tabItems.map((tab) => {
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSearchParams({ tab: tab.id })}
                            className={`rounded-[1.75rem] border p-5 text-left transition ${
                                isActive
                                    ? "border-accent/35 bg-accent/10 shadow-lg shadow-accent/5"
                                    : "border-white/8 bg-white/4 hover:border-white/12 hover:bg-white/6"
                            }`}
                        >
                            <p className="text-sm font-medium text-text/55">{tab.label}</p>
                            <h2 className="mt-2 text-2xl font-semibold text-text">{tab.label}</h2>
                            <p className="mt-2 text-sm leading-6 text-text/55">{tab.subtitle}</p>
                        </button>
                    );
                })}
            </section>

            {activeTab === "connections" ? (
                <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold text-text">
                                {editingConnectionId ? "Редактирование подключения" : "Новое подключение"}
                            </h2>
                            <p className="mt-1 text-sm text-text/55">
                                Храните здесь только подключения к существующим серверам.
                            </p>
                        </div>

                        {connectionNotice && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[connectionNotice.tone]}`}>
                                {connectionNotice.text}
                            </div>
                        )}

                        <form onSubmit={handleConnectionSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Имя подключения</label>
                                <input
                                    value={connectionForm.name}
                                    onChange={(event) => setConnectionForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="prod-postgres-1"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Тип СУБД</label>
                                <select
                                    value={connectionForm.dbType}
                                    onChange={(event) =>
                                        setConnectionForm((prev) => ({ ...prev, dbType: event.target.value }))
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
                                <label className="mb-2 block text-sm font-medium text-text/70">Connection string</label>
                                <textarea
                                    rows={5}
                                    value={connectionForm.connectionString}
                                    onChange={(event) =>
                                        setConnectionForm((prev) => ({ ...prev, connectionString: event.target.value }))
                                    }
                                    placeholder={
                                        editingConnectionId
                                            ? "Оставьте пустым, чтобы не менять сохраненное значение"
                                            : "Host=...;Database=...;Username=...;Password=..."
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                                />

                                {connectionStringTemplates[connectionForm.dbType] && (
                                    <div className="mt-3 space-y-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-s font-medium tracking-wider text-accent/80">
                                                    Пример для {connectionForm.dbType}
                                                </p>
                                                <p className="mt-1 text-sm text-text/55">
                                                    {connectionStringTemplates[connectionForm.dbType].description}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setConnectionForm((prev) => ({
                                                        ...prev,
                                                        connectionString: connectionStringTemplates[connectionForm.dbType].example
                                                    }));
                                                    setConnectionNotice({
                                                        tone: "info",
                                                        text: "Шаблон вставлен. Не забудьте заменить значения на реальные!"
                                                    });
                                                }}
                                                className="shrink-0 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/20"
                                            >
                                                Вставить шаблон
                                            </button>
                                        </div>

                                        <div className="rounded-xl border border-white/8 bg-[#0f1720] px-3 py-2">
                                            <code className="block overflow-x-auto whitespace-nowrap font-mono text-sm text-text/80">
                                                {connectionStringTemplates[connectionForm.dbType].example}
                                            </code>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <svg className="h-4 w-4 shrink-0 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-text/55">Больше примеров и вариантов:</span>
                                            <a
                                                href={connectionStringTemplates[connectionForm.dbType].url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-accent underline decoration-accent/30 underline-offset-2 transition hover:decoration-accent"
                                            >
                                                ConnectionStrings.com
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleTestConnection}
                                    disabled={
                                        isTestingConnection ||
                                        !connectionForm.name.trim() ||
                                        !connectionForm.dbType ||
                                        !connectionForm.connectionString.trim()
                                    }
                                    className="rounded-2xl border border-white/10 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isTestingConnection ? "Проверяем..." : "Проверить подключение"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isCreatingConnection ||
                                        isUpdatingConnection ||
                                        !connectionForm.name.trim() ||
                                        !connectionForm.dbType ||
                                        (!editingConnectionId && !connectionForm.connectionString.trim())
                                    }
                                    className="rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {editingConnectionId
                                        ? isUpdatingConnection
                                            ? "Сохраняем..."
                                            : "Сохранить подключение"
                                        : isCreatingConnection
                                          ? "Создаем..."
                                          : "Создать подключение"}
                                </button>
                                {editingConnectionId && (
                                    <button
                                        type="button"
                                        onClick={resetConnectionForm}
                                        className="rounded-2xl border border-white/10 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20"
                                    >
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold text-text">Список подключений</h2>
                            <p className="mt-1 text-sm text-text/55">
                                Здесь показываются только имя подключения, тип СУБД и маска строки подключения.
                            </p>
                        </div>

                        {connectionsLoading ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                Загружаем подключения...
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                Подключений пока нет.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {connections.map((connection) => (
                                    <article
                                        key={connection.id}
                                        className="rounded-3xl border border-white/8 bg-black/15 p-5"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                        {connection.dbType}
                                                    </span>
                                                    <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                                                        {connection.provider}
                                                    </span>
                                                </div>
                                                <h3 className="mt-3 text-xl font-semibold text-text">{connection.name}</h3>
                                                <p className="mt-2 break-all font-mono text-sm text-text/55">
                                                    {connection.maskedConnectionString}
                                                </p>
                                                <p className="mt-3 text-xs text-text/40">
                                                    Добавлено: {formatDateTime(connection.createdAt)}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => beginEditConnection(connection)}
                                                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                            >
                                                Редактировать
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold text-text">
                                {editingDatabaseId ? "Редактирование базы данных" : "Новая база данных"}
                            </h2>
                            <p className="mt-1 text-sm text-text/55">
                                Укажите логическое и физическое имя, описание, ERD и доступные подключения.
                            </p>
                        </div>

                        {databaseNotice && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[databaseNotice.tone]}`}>
                                {databaseNotice.text}
                            </div>
                        )}

                        <form onSubmit={handleDatabaseSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Логическое название</label>
                                <input
                                    value={databaseForm.logicalName}
                                    onChange={(event) =>
                                        setDatabaseForm((prev) => ({ ...prev, logicalName: event.target.value }))
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Физическое имя БД</label>
                                <input
                                    value={databaseForm.physicalName}
                                    onChange={(event) =>
                                        setDatabaseForm((prev) => ({ ...prev, physicalName: event.target.value }))
                                    }
                                    placeholder="training_shop"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Описание</label>
                                <textarea
                                    rows={5}
                                    value={databaseForm.description}
                                    onChange={(event) =>
                                        setDatabaseForm((prev) => ({ ...prev, description: event.target.value }))
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">ERD-диаграмма</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setDatabaseForm((prev) => ({
                                            ...prev,
                                            erdImage: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-3 text-sm text-text/65 file:mr-4 file:rounded-xl file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Доступные подключения</label>
                                {connections.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                        Сначала создайте хотя бы одно подключение.
                                    </div>
                                ) : (
                                    <div className="space-y-3 rounded-2xl border border-white/8 bg-black/15 p-4">
                                        {connections.map((connection) => {
                                            const checked = databaseForm.connectionIds.includes(connection.id);

                                            return (
                                                <label
                                                    key={connection.id}
                                                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/6 bg-black/15 px-4 py-3"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleConnectionSelection(connection.id)}
                                                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent/30"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-text">{connection.name}</p>
                                                        <p className="text-sm text-text/55">
                                                            {connection.dbType} · {connection.maskedConnectionString}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={
                                        isCreatingDatabase ||
                                        isUpdatingDatabase ||
                                        !databaseForm.logicalName.trim() ||
                                        !databaseForm.physicalName.trim() ||
                                        !databaseForm.description.trim() ||
                                        databaseForm.connectionIds.length === 0
                                    }
                                    className="rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {editingDatabaseId
                                        ? isUpdatingDatabase
                                            ? "Сохраняем..."
                                            : "Сохранить базу данных"
                                        : isCreatingDatabase
                                          ? "Создаем..."
                                          : "Создать базу данных"}
                                </button>
                                {editingDatabaseId && (
                                    <button
                                        type="button"
                                        onClick={resetDatabaseForm}
                                        className="rounded-2xl border border-white/10 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20"
                                    >
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold text-text">Список баз данных</h2>
                            <p className="mt-1 text-sm text-text/55">
                                Можно открыть карточку базы данных, отредактировать ее и перейти к заданиям или контрольным.
                            </p>
                        </div>

                        {databasesLoading ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                Загружаем базы данных...
                            </div>
                        ) : databases.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                Баз данных пока нет.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {databases.map((database) => {
                                    const erdImageUrl = getAssetUrl(database.erdImagePath);

                                    return (
                                        <article
                                            key={database.id}
                                            className="rounded-3xl border border-white/8 bg-black/15 p-5"
                                        >
                                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                            {database.logicalName}
                                                        </span>
                                                        <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
                                                            {database.physicalName}
                                                        </span>
                                                    </div>

                                                    <p className="mt-3 text-sm leading-6 text-text/65">{database.description}</p>

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {database.deployments.map((item) => (
                                                            <span
                                                                key={item.id}
                                                                className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary"
                                                            >
                                                                {item.dbMeta?.name ?? "Подключение"} · {item.dbMeta?.dbType ?? "СУБД"}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-3">
                                                        <Link
                                                            to={`/admin/databases/${database.id}`}
                                                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                                        >
                                                            Подробнее
                                                        </Link>
                                                        <Link
                                                            to={`/add-exercise?databaseMetaId=${database.id}`}
                                                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                                        >
                                                            Добавить задание
                                                        </Link>
                                                        <Link
                                                            to={`/admin/exams?databaseMetaId=${database.id}`}
                                                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                                        >
                                                            Назначить КР
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => beginEditDatabase(database)}
                                                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                                        >
                                                            Редактировать
                                                        </button>
                                                    </div>
                                                </div>

                                                {erdImageUrl && (
                                                    <img
                                                        src={erdImageUrl}
                                                        alt={`ERD ${database.logicalName}`}
                                                        className="h-36 w-full rounded-3xl border border-white/8 object-cover lg:w-56"
                                                    />
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};
