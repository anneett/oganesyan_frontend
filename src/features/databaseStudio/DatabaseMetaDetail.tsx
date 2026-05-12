import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { API_ORIGIN } from "../../app/baseQuery";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import {
    type UpdateDatabaseMetaRequest,
    useGetDatabaseMetaByIdQuery,
    useGetDbMetasQuery,
    useUpdateDatabaseMetaMutation,
} from "../databaseMetas/databaseMetasApi";

const getAssetUrl = (path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith("/") ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`;
};

export const DatabaseMetaDetail = () => {
    const { id } = useParams();
    const databaseMetaId = Number(id);

    const { data: meta, isLoading } = useGetDatabaseMetaByIdQuery(databaseMetaId);
    const { data: connections = [] } = useGetDbMetasQuery();
    const [updateDatabaseMeta, { isLoading: isSaving }] = useUpdateDatabaseMetaMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<UpdateDatabaseMetaRequest>({
        logicalName: "",
        physicalName: "",
        description: "",
        connectionIds: [],
        erdImage: null,
        removeErdImage: false,
    });

    useEffect(() => {
        if (!meta) return;
        setForm({
            logicalName: meta.logicalName,
            physicalName: meta.physicalName,
            description: meta.description,
            connectionIds: meta.deployments.map((item) => item.dbMetaId),
            erdImage: null,
            removeErdImage: false,
        });
    }, [meta]);

    if (isLoading) {
        return <div className="mx-auto max-w-6xl px-4 py-8 text-text/60">Загружаем базу данных...</div>;
    }

    if (!meta) {
        return <div className="mx-auto max-w-6xl px-4 py-8 text-red-300">База данных не найдена.</div>;
    }

    const erdImageUrl = getAssetUrl(meta.erdImagePath);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            await updateDatabaseMeta({
                id: meta.id,
                payload: form,
            }).unwrap();
            setNotice("Изменения сохранены.");
            setError(null);
            setIsEditing(false);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "Не удалось сохранить изменения."));
            setNotice(null);
        }
    };

    const toggleConnection = (connectionId: number) => {
        setForm((prev) => ({
            ...prev,
            connectionIds: prev.connectionIds.includes(connectionId)
                ? prev.connectionIds.filter((id) => id !== connectionId)
                : [...prev.connectionIds, connectionId],
        }));
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <section className="mb-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-text/40">Database</p>
                        <h1 className="mt-3 text-3xl font-semibold text-text">{meta.logicalName}</h1>
                        <p className="mt-3 max-w-3xl text-base leading-7 text-text/65">{meta.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent">
                                {meta.physicalName}
                            </span>
                            {meta.deployments.map((deployment) => (
                                <span
                                    key={deployment.id}
                                    className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-sm text-secondary"
                                >
                                    {deployment.dbMeta?.name ?? "Подключение"} · {deployment.dbMeta?.dbType ?? "СУБД"}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            to={`/add-exercise?databaseMetaId=${meta.id}`}
                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                        >
                            Добавить задание
                        </Link>
                        <Link
                            to={`/admin/exams?databaseMetaId=${meta.id}`}
                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                        >
                            Назначить КР
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsEditing((prev) => !prev)}
                            className="rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-background"
                        >
                            {isEditing ? "Скрыть форму" : "Редактировать"}
                        </button>
                    </div>
                </div>
            </section>

            {notice && <div className="mb-4 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300">{notice}</div>}
            {error && <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
                <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                    <h2 className="text-2xl font-semibold text-text">Обзор базы данных</h2>
                    <div className="mt-5 space-y-4 text-sm text-text/70">
                        <div>
                            <p className="text-text/45">Логическое название</p>
                            <p className="mt-1 text-base text-text">{meta.logicalName}</p>
                        </div>
                        <div>
                            <p className="text-text/45">Физическое имя</p>
                            <p className="mt-1 text-base text-text">{meta.physicalName}</p>
                        </div>
                        <div>
                            <p className="text-text/45">Подключений</p>
                            <p className="mt-1 text-base text-text">{meta.deployments.length}</p>
                        </div>
                    </div>

                    {erdImageUrl ? (
                        <img
                            src={erdImageUrl}
                            alt={`ERD ${meta.logicalName}`}
                            className="mt-6 w-full rounded-3xl border border-white/8 object-cover"
                        />
                    ) : (
                        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/15 px-4 py-10 text-center text-sm text-text/55">
                            ERD-диаграмма пока не загружена.
                        </div>
                    )}
                </div>

                <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                    <h2 className="text-2xl font-semibold text-text">Редактирование</h2>
                    <p className="mt-1 text-sm text-text/55">Изменения доступны только администратору.</p>

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Логическое название</label>
                                <input
                                    value={form.logicalName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, logicalName: event.target.value }))}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Физическое имя</label>
                                <input
                                    value={form.physicalName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, physicalName: event.target.value }))}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Описание</label>
                                <textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Новая ERD-диаграмма</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            erdImage: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-3 text-sm text-text/65 file:mr-4 file:rounded-xl file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent"
                                />
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                <p className="mb-3 text-sm font-medium text-text/70">Подключения</p>
                                <div className="space-y-3">
                                    {connections.map((connection) => (
                                        <label key={connection.id} className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={form.connectionIds.includes(connection.id)}
                                                onChange={() => toggleConnection(connection.id)}
                                                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent/30"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-text">{connection.name}</p>
                                                <p className="text-xs text-text/50">{connection.dbType}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background disabled:opacity-50"
                            >
                                {isSaving ? "Сохраняем..." : "Сохранить изменения"}
                            </button>
                        </form>
                    ) : (
                        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/15 px-4 py-10 text-center text-sm text-text/55">
                            Нажмите «Редактировать», чтобы изменить параметры базы данных.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
