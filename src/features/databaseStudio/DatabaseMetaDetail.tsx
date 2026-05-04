import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { API_ORIGIN } from "../../app/baseQuery";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import {
    useGetDatabaseMetaByIdQuery,
    useUpdateDatabaseMetaMutation,
    type UpdateDatabaseMetaRequest,
} from "../databaseMetas/databaseMetasApi";

type NoticeTone = "success" | "error";

const noticeClasses: Record<NoticeTone, string> = {
    success: "border-green-500/30 bg-green-500/10 text-green-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
};

export const DatabaseMetaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const metaId = Number(id);

    const { data: meta, isLoading, refetch } = useGetDatabaseMetaByIdQuery(metaId, {
        skip: !metaId,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
    const [newErdImage, setNewErdImage] = useState<File | null>(null);

    const [editForm, setEditForm] = useState<UpdateDatabaseMetaRequest>({
        logicalName: "",
        description: "",
        createScriptTemplate: "",
        removeErdImage: false,
        erdImage: null,
    });

    const [updateDatabaseMeta, { isLoading: isUpdating }] = useUpdateDatabaseMetaMutation();

    const startEditing = () => {
        if (!meta) return;
        setEditForm({
            logicalName: meta.logicalName,
            description: meta.description,
            createScriptTemplate: meta.createScriptTemplate ?? "",
            removeErdImage: false,
            erdImage: null,
        });
        setNewErdImage(null);
        setIsEditing(true);
        setNotice(null);
    };

    const handleUpdate = async (event: FormEvent) => {
        event.preventDefault();

        try {
            await updateDatabaseMeta({
                id: metaId,
                payload: {
                    ...editForm,
                    erdImage: newErdImage,
                },
            }).unwrap();

            setNotice({ tone: "success", text: "Логическая БД успешно обновлена." });
            setIsEditing(false);
            setNewErdImage(null);
            await refetch();
        } catch (error) {
            setNotice({
                tone: "error",
                text: getApiErrorMessage(error, "Не удалось обновить логическую БД."),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <p className="text-text/55">Загрузка...</p>
            </div>
        );
    }

    if (!meta) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-10 text-center">
                    <p className="text-red-300">Логическая БД не найдена.</p>
                    <Link
                        to="/admin/databases"
                        className="mt-4 inline-flex rounded-2xl bg-accent/15 px-4 py-2 font-medium text-accent transition hover:bg-accent/20"
                    >
                        Вернуться к списку
                    </Link>
                </div>
            </div>
        );
    }

    const deployedCount = meta.deployments?.filter((d) => d.isDeployed).length ?? 0;
    const totalCount = meta.deployments?.length ?? 0;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <div className="mb-6 flex items-center gap-3">
                <Link
                    to="/admin/databases"
                    className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text/70 transition hover:bg-black/20 hover:text-text"
                >
                    ← Назад
                </Link>
                <span className="text-text/30">/</span>
                <span className="text-sm text-text/55">{meta.logicalName}</span>
            </div>

            <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.15),rgba(64,110,132,0.14),rgba(70,175,171,0.12))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-text/40">Логическая БД</p>
                        <h1 className="text-3xl font-semibold text-text sm:text-4xl">{meta.logicalName}</h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-text/65">{meta.description}</p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                {meta.createScriptTemplate ? "Есть SQL-шаблон" : "Без SQL-шаблона"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                {meta.erdImagePath ? "ERD загружена" : "ERD не загружена"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-text/55">
                                Создана: {new Date(meta.createdAt).toLocaleDateString("ru-RU")}
                            </span>
                        </div>
                    </div>

                    {meta.erdImagePath && (
                        <a
                            href={`${API_ORIGIN}${meta.erdImagePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl border border-white/10 bg-[#0f1720] transition hover:border-white/20"
                        >
                            <img
                                src={`${API_ORIGIN}${meta.erdImagePath}`}
                                alt={`ERD ${meta.logicalName}`}
                                className="h-36 w-56 object-cover"
                            />
                        </a>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs text-text/50">Развертывания</p>
                        <p className="mt-1 text-2xl font-semibold text-accent">{deployedCount}/{totalCount}</p>
                    </div>
                    <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs text-text/50">SQL-шаблон</p>
                        <p className="mt-1 text-lg font-semibold text-text">
                            {meta.createScriptTemplate ? "Есть" : "Нет"}
                        </p>
                    </div>
                </div>
            </section>

            {notice && (
                <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${noticeClasses[notice.tone]}`}>
                    {notice.text}
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-3">
                <Link
                    to={`/exercises?databaseMetaId=${meta.id}`}
                    className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-text transition hover:bg-white/6"
                >
                    Задания этой БД →
                </Link>
                <Link
                    to={`/add-exercise?databaseMetaId=${meta.id}`}
                    className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/15"
                >
                    + Добавить задание
                </Link>
                <Link
                    to={`/admin/exams?databaseMetaId=${meta.id}`}
                    className="rounded-2xl border border-secondary/25 bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary/15"
                >
                    Создать контрольную
                </Link>
            </div>

            <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-text">Редактирование</h2>
                            <p className="mt-1 text-sm text-text/55">Название, описание, шаблон и ERD.</p>
                        </div>
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={startEditing}
                                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                            >
                                Редактировать
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Название</label>
                                <input
                                    type="text"
                                    value={editForm.logicalName}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({ ...prev, logicalName: e.target.value }))
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Описание</label>
                                <textarea
                                    rows={4}
                                    value={editForm.description}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">SQL-шаблон</label>
                                <textarea
                                    rows={8}
                                    value={editForm.createScriptTemplate ?? ""}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            createScriptTemplate: e.target.value,
                                        }))
                                    }
                                    placeholder="CREATE TABLE ...;"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">ERD-изображение</label>
                                {meta.erdImagePath && !editForm.removeErdImage && (
                                    <div className="mb-3 flex items-center gap-3">
                                        <img
                                            src={`${API_ORIGIN}${meta.erdImagePath}`}
                                            alt="Текущее ERD"
                                            className="h-16 w-24 rounded-xl object-cover border border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditForm((prev) => ({ ...prev, removeErdImage: true }))
                                            }
                                            className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/15"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                )}
                                {editForm.removeErdImage && (
                                    <div className="mb-3 flex items-center gap-2 text-sm text-yellow-300">
                                        <span>Изображение будет удалено.</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditForm((prev) => ({ ...prev, removeErdImage: false }))
                                            }
                                            className="underline"
                                        >
                                            Отменить
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setNewErdImage(file);
                                        setEditForm((prev) => ({ ...prev, removeErdImage: false }));
                                    }}
                                    className="block w-full rounded-2xl border border-dashed border-white/12 bg-[#0f1720] px-4 py-3 text-sm text-text/60 file:mr-4 file:rounded-xl file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:font-medium file:text-accent"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={
                                        isUpdating ||
                                        !editForm.logicalName.trim() ||
                                        !editForm.description.trim()
                                    }
                                    className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    {isUpdating ? "Сохранение..." : "Сохранить"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="rounded-2xl border border-white/10 bg-black/15 px-5 py-3 font-medium text-text transition hover:bg-black/20"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-text/50">Название</p>
                                <p className="mt-1 text-text">{meta.logicalName}</p>
                            </div>
                            <div>
                                <p className="text-text/50">Описание</p>
                                <p className="mt-1 leading-6 text-text/80">{meta.description}</p>
                            </div>
                            <div>
                                <p className="text-text/50">SQL-шаблон</p>
                                {meta.createScriptTemplate ? (
                                    <pre className="mt-1 max-h-40 overflow-auto rounded-xl border border-white/10 bg-[#0f1720] p-3 text-xs text-text/80">
                                        {meta.createScriptTemplate}
                                    </pre>
                                ) : (
                                    <p className="mt-1 text-yellow-400">Не задан</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-text">Развертывания</h2>
                            <p className="mt-1 text-sm text-text/55">{deployedCount} из {totalCount} активны</p>
                        </div>
                        <Link
                            to="/admin/databases"
                            state={{ tab: "deployments", metaId: meta.id }}
                            className="rounded-2xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/15"
                        >
                            + Добавить
                        </Link>
                    </div>

                    {totalCount === 0 ? (
                        <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-8 text-center text-text/50">
                            Нет развертываний.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {meta.deployments?.map((deployment) => (
                                <article key={deployment.id} className="rounded-3xl border border-white/8 bg-black/15 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-text">{deployment.physicaDatabaseName}</p>
                                            <p className="mt-1 text-xs text-text/50">
                                                {deployment.dbMeta?.dbType} · {deployment.dbMeta?.provider}
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                            deployment.isDeployed
                                                ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                        }`}>
                                            {deployment.isDeployed ? "Развернута" : "Не развернута"}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
