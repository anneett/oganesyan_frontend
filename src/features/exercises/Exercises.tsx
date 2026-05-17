import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useGetDatabaseMetasQuery, useGetDbMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useGetUserStatsQuery, useGetUsersQuery, useGetUserProfileQuery } from "../users/usersApi";
import { useGetExercisesQuery } from "./exercisesApi";
import { useGetExamsQuery } from "../exams/examsApi";

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
    const { data: users = [] } = useGetUsersQuery();
    const { data: user } = useGetUserProfileQuery();
    const { data: exams = [] } = useGetExamsQuery();
    const { data: dbMetas = [] } = useGetDbMetasQuery();

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
        return configs[difficulty - 1] || configs[0];
    };

    const activeUsersCount = users.filter(u => !u.inArchive).length;
    const adminCount = users.filter(u => !u.inArchive && u.isAdmin).length;
    const totalConnections = dbMetas.length;
    const totalExams = exams.length;
    const unreleasedResultsCount = exams.filter(e => !e.isResultsReleased).length;

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
                {user?.isAdmin && (
                    <div className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <Link to="/admin/databases?tab=connections" className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-blue-600/10 to-blue-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <h3 className="text-xl font-bold text-text group-hover:text-blue-200 transition-colors">Подключения</h3>
                                <p className="mt-1 text-sm text-text/50">Доступные подключения</p>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <span className="text-sm font-medium text-blue-300">{totalConnections} подключений</span>
                                <div className="rounded-full bg-black/20 p-2 text-text/50 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>

                        <Link to="/admin/databases?tab=databases" className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-indigo-600/10 to-indigo-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <h3 className="text-xl font-bold text-text group-hover:text-indigo-200 transition-colors">Базы данных</h3>
                                <p className="mt-1 text-sm text-text/50">Логические схемы</p>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <span className="text-sm font-medium text-indigo-300">{databases.length} баз данных</span>
                                <div className="rounded-full bg-black/20 p-2 text-text/50 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>

                        <Link to="/add-exercise" className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-orange-600/10 to-orange-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-900/20 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <h3 className="text-xl font-bold text-text group-hover:text-orange-200 transition-colors">Добавление задач</h3>
                                <p className="mt-1 text-sm text-text/50">Создание и загрузка</p>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <div className="text-sm font-medium text-orange-300 flex flex-wrap gap-x-2">
                                    {databases.slice(0, 2).map(db => (
                                        <span key={db.id}>{db.logicalName}: {exercises?.filter(e => e.databaseMetaId === db.id).length || 0}</span>
                                    ))}
                                    {databases.length > 2 && <span>...</span>}
                                </div>
                                <div className="rounded-full bg-black/20 p-2 text-text/50 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                            </div>
                        </Link>

                        <Link to="/admin/exams" className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-purple-600/10 to-purple-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/20 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <h3 className="text-xl font-bold text-text group-hover:text-purple-200 transition-colors">Контрольные</h3>
                                <p className="mt-1 text-sm text-text/50">Назначение и управление</p>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <span className="text-sm font-medium text-purple-300">Всего: {totalExams} <span className="mx-1 text-purple-300/50">•</span> Неопубликованных: {unreleasedResultsCount}</span>
                                <div className="rounded-full bg-black/20 p-2 text-text/50 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>

                        <Link to="/solutions" className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-emerald-600/10 to-emerald-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/20 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <h3 className="text-xl font-bold text-text group-hover:text-emerald-200 transition-colors">Статистика</h3>
                                <p className="mt-1 text-sm text-text/50">Успеваемость и метрики</p>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <span className="text-sm font-medium text-emerald-300">Заданий: {totalExercises} <span className="mx-1 text-emerald-300/50">•</span> Пользователей: {activeUsersCount}</span>
                                <div className="rounded-full bg-black/20 p-2 text-text/50 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                            </div>
                        </Link>

                        <Link to="/users" className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-rose-600/10 to-rose-900/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-900/20 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-text group-hover:text-rose-200 transition-colors">Пользователи</h3>
                                </div>
                                <p className="mt-1 text-sm text-text/50">Управление учетными записями</p>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <span className="text-sm font-medium text-rose-300">Действующих: {activeUsersCount} <span className="mx-1 text-rose-300/50">•</span> Админов: {adminCount}</span>
                                <div className="rounded-full bg-black/20 p-2 text-text/50 group-hover:bg-rose-500/20 group-hover:text-rose-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Всего заданий</p>
                        <p className="text-3xl font-bold text-primary">{totalExercises}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Решено вами</p>
                        <p className="text-3xl font-bold text-green-400">{solvedCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Ваш прогресс</p>
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
                        <option value="1">Легкая</option>
                        <option value="2">Средняя</option>
                        <option value="3">Сложная</option>
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

                        const isSolved = solvedExerciseIds.has(exercise.id);

                        return (
                            <Link
                                key={exercise.id}
                                to={`/exercise/${exercise.id}`}
                                className={`block rounded-2xl border bg-secondary/5 p-5 transition hover:bg-secondary/10 ${
                                    isSolved ? "border-green-500/30 hover:border-green-500/50" : "border-secondary/20 hover:border-accent/30"
                                }`}
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

                                    <div className="flex items-center gap-4">
                                        {isSolved && (
                                            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/30 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Решено
                                            </span>
                                        )}
                                        <div className="flex items-center text-accent font-medium text-sm gap-1 group-hover:translate-x-1 transition-transform">
                                            Открыть
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
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