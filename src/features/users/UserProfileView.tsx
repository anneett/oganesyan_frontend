import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useGetUserProfileByIdQuery, useGetUserStatsQuery } from "./usersApi";

export function UserProfileView() {
    const { id } = useParams();
    const userId = Number(id);
    const [selectedDatabaseMetaId, setSelectedDatabaseMetaId] = useState<number | null>(null);

    const { data: user, isLoading: loadingUser } = useGetUserProfileByIdQuery(userId);
    const { data: databases = [] } = useGetDatabaseMetasQuery();
    const { data: stats = [], isLoading: loadingStats } = useGetUserStatsQuery({
        userId,
        ...(selectedDatabaseMetaId ? { databaseMetaId: selectedDatabaseMetaId } : {}),
    });

    const totalSolutions = stats.length;
    const correctSolutions = stats.filter((item) => item.isCorrect).length;
    const successRate = totalSolutions > 0 ? Math.round((correctSolutions / totalSolutions) * 100) : 0;
    const solvedExercises = useMemo(() => new Set(stats.filter((item) => item.isCorrect).map((item) => item.exerciseId)), [stats]);

    if (loadingUser || loadingStats) {
        return <div className="mx-auto max-w-6xl px-4 py-8 text-text/60">Загружаем профиль студента...</div>;
    }

    if (!user) {
        return <div className="mx-auto max-w-6xl px-4 py-8 text-red-300">Студент не найден.</div>;
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <section className="mb-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-text/40">Student Profile</p>
                        <h1 className="mt-3 text-3xl font-semibold text-text">{user.userName}</h1>
                        <p className="mt-2 text-text/60">@{user.login}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Попыток</p>
                            <p className="mt-2 text-2xl font-semibold text-primary">{totalSolutions}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Решено задач</p>
                            <p className="mt-2 text-2xl font-semibold text-secondary">{solvedExercises.size}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Успешность</p>
                            <p className="mt-2 text-2xl font-semibold text-accent">{successRate}%</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mb-6">
                <select
                    value={selectedDatabaseMetaId ?? ""}
                    onChange={(event) => setSelectedDatabaseMetaId(event.target.value ? Number(event.target.value) : null)}
                    className="rounded-xl border border-secondary/30 bg-background px-4 py-3 text-text focus:border-accent focus:outline-none"
                >
                    <option value="">Все базы данных</option>
                    {databases.map((database) => (
                        <option key={database.id} value={database.id}>
                            {database.logicalName}
                        </option>
                    ))}
                </select>
            </div>

            <section className="space-y-4">
                {stats.map((solution) => (
                    <article key={solution.solutionId} className="rounded-2xl border border-secondary/20 bg-secondary/5 p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-text">{solution.exerciseTitle}</h2>
                                <p className="mt-2 text-sm text-text/55">{new Date(solution.submittedAt).toLocaleString("ru-RU")}</p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${
                                    solution.isCorrect
                                        ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                        : "border border-red-500/20 bg-red-500/10 text-red-300"
                                }`}
                            >
                                {solution.isCorrect ? "Верно" : "Ошибка"}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-[#0f1720] p-4">
                                <p className="mb-2 text-sm font-medium text-text/70">Ответ студента</p>
                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">{solution.userAnswer}</pre>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-[#0f1720] p-4">
                                <p className="mb-2 text-sm font-medium text-text/70">Правильный ответ</p>
                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">{solution.correctAnswer}</pre>
                            </div>
                        </div>
                    </article>
                ))}

                {stats.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-secondary/20 bg-secondary/5 p-10 text-center text-text/50">
                        По выбранному фильтру решений пока нет.
                    </div>
                )}
            </section>
        </div>
    );
}
