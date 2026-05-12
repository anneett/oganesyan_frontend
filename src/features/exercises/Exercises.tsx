import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useGetUserStatsQuery } from "../users/usersApi";
import { useGetExercisesQuery } from "./exercisesApi";

type FilterStatus = "all" | "solved" | "unsolved";
type SortOption = "default" | "easy-first" | "hard-first";

export function Exercises() {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [sortOption, setSortOption] = useState<SortOption>("default");
    const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);
    const [selectedDatabaseMetaId, setSelectedDatabaseMetaId] = useState<number | null>(null);

    const { data: databases = [] } = useGetDatabaseMetasQuery();
    const { data: exercises, isLoading, error } = useGetExercisesQuery(
        selectedDatabaseMetaId ? { databaseMetaId: selectedDatabaseMetaId } : undefined,
    );
    const { data: userStats, isLoading: loadingStats } = useGetUserStatsQuery();

    const solvedExerciseIds = useMemo(() => {
        return new Set((userStats ?? []).filter((solution) => solution.isCorrect).map((solution) => solution.exerciseId));
    }, [userStats]);

    const totalExercises = exercises?.length || 0;
    const solvedCount = useMemo(() => {
        if (!exercises) return 0;
        return exercises.filter((exercise) => solvedExerciseIds.has(exercise.id)).length;
    }, [exercises, solvedExerciseIds]);

    const progressPercent = totalExercises > 0 ? Math.round((solvedCount / totalExercises) * 100) : 0;

    const filteredExercises = useMemo(() => {
        if (!exercises) return [];

        let result = [...exercises];

        if (search) {
            result = result.filter((exercise) => exercise.title.toLowerCase().includes(search.toLowerCase()));
        }

        if (filterStatus === "solved") {
            result = result.filter((exercise) => solvedExerciseIds.has(exercise.id));
        } else if (filterStatus === "unsolved") {
            result = result.filter((exercise) => !solvedExerciseIds.has(exercise.id));
        }

        if (filterDifficulty !== null) {
            result = result.filter((exercise) => exercise.difficulty === filterDifficulty);
        }

        if (sortOption === "easy-first") {
            result.sort((a, b) => a.difficulty - b.difficulty);
        } else if (sortOption === "hard-first") {
            result.sort((a, b) => b.difficulty - a.difficulty);
        }

        return result;
    }, [exercises, filterDifficulty, filterStatus, search, solvedExerciseIds, sortOption]);

    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкая", color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { label: "Средняя", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            { label: "Сложная", color: "bg-red-500/20 text-red-400 border-red-500/30" },
        ];
        return configs[difficulty] || configs[0];
    };

    if (isLoading || loadingStats) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-text/70">Загрузка упражнений...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-sm w-full">
                    <p className="text-red-400 font-medium">Ошибка загрузки данных</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Всего</p>
                        <p className="text-3xl font-bold text-primary">{totalExercises}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Решено</p>
                        <p className="text-3xl font-bold text-green-400">{solvedCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Прогресс</p>
                        <p className="text-3xl font-bold text-accent">{progressPercent}%</p>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-[1fr,220px,220px]">
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="rounded-xl border border-secondary/30 bg-background px-4 py-3 text-text placeholder-text/40 focus:border-accent focus:outline-none"
                    />
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
                    <select
                        value={filterDifficulty ?? ""}
                        onChange={(event) => setFilterDifficulty(event.target.value ? Number(event.target.value) : null)}
                        className="rounded-xl border border-secondary/30 bg-background px-4 py-3 text-text focus:border-accent focus:outline-none"
                    >
                        <option value="">Любая сложность</option>
                        <option value="0">Легкая</option>
                        <option value="1">Средняя</option>
                        <option value="2">Сложная</option>
                    </select>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {[
                        { id: "all", label: "Все" },
                        { id: "unsolved", label: "Нерешенные" },
                        { id: "solved", label: "Решенные" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setFilterStatus(item.id as FilterStatus)}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                filterStatus === item.id
                                    ? "bg-accent text-background"
                                    : "bg-secondary/10 text-text/70 hover:bg-secondary/20"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}

                    {[
                        { id: "default", label: "Без сортировки" },
                        { id: "easy-first", label: "Сначала легкие" },
                        { id: "hard-first", label: "Сначала сложные" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSortOption(item.id as SortOption)}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                sortOption === item.id
                                    ? "bg-primary text-background"
                                    : "bg-secondary/10 text-text/70 hover:bg-secondary/20"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="grid gap-4">
                    {filteredExercises.map((exercise) => {
                        const difficulty = getDifficultyConfig(exercise.difficulty);
                        const databaseName =
                            databases.find((database) => database.id === exercise.databaseMetaId)?.logicalName ?? "База данных";

                        return (
                            <article
                                key={exercise.id}
                                className="rounded-2xl border border-secondary/20 bg-secondary/5 p-5 transition hover:border-accent/30 hover:bg-secondary/10"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${difficulty.color}`}>
                                                {difficulty.label}
                                            </span>
                                            <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs text-secondary">
                                                {databaseName}
                                            </span>
                                        </div>
                                        <h2 className="mt-3 text-xl font-semibold text-text">{exercise.title}</h2>
                                    </div>

                                    <Link
                                        to={`/exercise/${exercise.id}`}
                                        className="rounded-xl bg-accent/15 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/20"
                                    >
                                        Открыть
                                    </Link>
                                </div>
                            </article>
                        );
                    })}

                    {filteredExercises.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-secondary/20 bg-secondary/5 p-10 text-center text-text/50">
                            Упражнения по выбранным фильтрам не найдены.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
