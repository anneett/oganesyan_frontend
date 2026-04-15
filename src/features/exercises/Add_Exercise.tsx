import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useCreateExerciseMutation } from "./exercisesApi";

const difficultyOptions = [
    { value: 0 as const, label: "Легкая", idle: "border-green-500/25 bg-green-500/10 text-green-300", active: "border-green-400 bg-green-500/20 text-green-200" },
    { value: 1 as const, label: "Средняя", idle: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300", active: "border-yellow-400 bg-yellow-500/20 text-yellow-100" },
    { value: 2 as const, label: "Сложная", idle: "border-red-500/25 bg-red-500/10 text-red-300", active: "border-red-400 bg-red-500/20 text-red-100" },
];

export const Add_Exercise = () => {
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState<0 | 1 | 2>(0);
    const [databaseMetaId, setDatabaseMetaId] = useState<number>(0);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [messageTone, setMessageTone] = useState<"success" | "error">("success");

    const { data: databaseMetas = [], isLoading: isLoadingMetas } = useGetDatabaseMetasQuery();
    const [createExercise, { isLoading }] = useCreateExerciseMutation();

    const effectiveDatabaseMetaId = databaseMetaId || databaseMetas[0]?.id || 0;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        try {
            await createExercise({
                title,
                difficulty,
                databaseMetaId: effectiveDatabaseMetaId,
                correctAnswer,
            }).unwrap();

            setMessageTone("success");
            setMessage("Задание успешно создано и привязано к выбранной логической БД.");
            setTitle("");
            setDifficulty(0);
            setCorrectAnswer("");
        } catch (error) {
            setMessageTone("error");
            setMessage(getApiErrorMessage(error, "Не удалось создать задание."));
        }
    };

    const isFormValid = title.trim() && correctAnswer.trim() && effectiveDatabaseMetaId !== 0;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.15),rgba(64,110,132,0.14),rgba(70,175,171,0.12))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-text/40">Exercise Builder</p>
                <h1 className="text-3xl font-semibold text-text sm:text-4xl">Создание задания с привязкой к логической БД</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-text/65">
                    Каждое упражнение связано с конкретной схемой данных. Это позволяет запускать обычный режим
                    и контрольную на нужном развертывании без ручных доработок.
                </p>
            </section>

            {message && (
                <div
                    className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                        messageTone === "success"
                            ? "border-green-500/25 bg-green-500/10 text-green-300"
                            : "border-red-500/25 bg-red-500/10 text-red-300"
                    }`}
                >
                    {message}
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
                <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-text">Параметры задания</h2>
                        <p className="mt-1 text-sm text-text/55">Название, сложность, логическая БД и эталонный SQL-запрос.</p>
                    </div>

                    {isLoadingMetas ? (
                        <p className="text-text/55">Загружаем список логических БД...</p>
                    ) : databaseMetas.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center">
                            <p className="text-text/55">Сначала нужно создать хотя бы одну логическую БД.</p>
                            <Link
                                to="/admin/databases"
                                className="mt-4 inline-flex rounded-2xl bg-accent/15 px-4 py-2 font-medium text-accent transition hover:bg-accent/20"
                            >
                                Перейти в раздел баз
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Название задания</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="Например: найти всех клиентов без заказов"
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Логическая БД</label>
                                <select
                                    value={effectiveDatabaseMetaId}
                                    onChange={(event) => setDatabaseMetaId(Number(event.target.value))}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                >
                                    {databaseMetas.map((databaseMeta) => (
                                        <option key={databaseMeta.id} value={databaseMeta.id}>
                                            {databaseMeta.logicalName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-3 block text-sm font-medium text-text/70">Сложность</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {difficultyOptions.map((option) => {
                                        const active = option.value === difficulty;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setDifficulty(option.value)}
                                                className={`rounded-2xl border px-4 py-4 font-medium transition ${
                                                    active ? option.active : option.idle
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-text/70">Правильный SQL-ответ</label>
                                <textarea
                                    rows={8}
                                    value={correctAnswer}
                                    onChange={(event) => setCorrectAnswer(event.target.value)}
                                    placeholder="SELECT ..."
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                                />
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="submit"
                                    disabled={isLoading || !isFormValid}
                                    className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    {isLoading ? "Создание..." : "Создать задание"}
                                </button>
                                <Link
                                    to="/exercises"
                                    className="flex-1 rounded-2xl border border-white/10 bg-black/15 px-5 py-3 text-center font-medium text-text transition hover:bg-black/20"
                                >
                                    Вернуться к списку
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <aside className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                    <h2 className="text-2xl font-semibold text-text">Подсказки</h2>
                    <div className="mt-5 space-y-4 text-sm leading-6 text-text/60">
                        <p>Выбирайте логическую БД внимательно: именно по ней потом ищутся развертывания для решения.</p>
                        <p>Эталонный SQL должен возвращать тот же результат, что и ожидаемый ответ студента.</p>
                        <p>Если схема еще не создана, сначала добавьте ее в разделе управления базами.</p>
                    </div>

                    {databaseMetas.length > 0 && (
                        <div className="mt-6 rounded-3xl border border-white/8 bg-black/15 p-5">
                            <p className="text-sm font-medium text-text/70">Доступные логические БД</p>
                            <div className="mt-4 space-y-3">
                                {databaseMetas.map((databaseMeta) => (
                                    <div key={databaseMeta.id} className="rounded-2xl border border-white/8 bg-[#0f1720] px-4 py-3">
                                        <p className="font-medium text-text">{databaseMeta.logicalName}</p>
                                        <p className="mt-1 text-sm text-text/45">{databaseMeta.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </section>
        </div>
    );
};
