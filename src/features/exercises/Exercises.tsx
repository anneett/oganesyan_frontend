import { useGetExercisesQuery } from "./exercisesApi.ts";
import { useGetUserStatsQuery } from "../users/usersApi.ts";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

type FilterStatus = 'all' | 'solved' | 'unsolved';
type SortOption = 'default' | 'easy-first' | 'hard-first';

export function Exercises() {
    const { data: exercises, isLoading, error } = useGetExercisesQuery();
    const { data: userStats, isLoading: loadingStats } = useGetUserStatsQuery();
    const [search, setSearch] = useState("");

    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortOption, setSortOption] = useState<SortOption>('default');
    const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const solvedExerciseIds = useMemo(() => {
        if (!userStats) return new Set<number>();
        return new Set(
            userStats
                .filter(solution => solution.isCorrect)
                .map(solution => solution.exerciseId)
        );
    }, [userStats]);

    const totalExercises = exercises?.length || 0;
    const solvedCount = useMemo(() => {
        if (!exercises) return 0;
        return exercises.filter(ex => solvedExerciseIds.has(ex.id)).length;
    }, [exercises, solvedExerciseIds]);

    const progressPercent = totalExercises > 0 ? Math.round((solvedCount / totalExercises) * 100) : 0;

    const filteredAndSorted = useMemo(() => {
        if (!exercises) return [];

        let result = [...exercises];

        if (search) {
            result = result.filter(ex =>
                ex.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (filterStatus === 'solved') {
            result = result.filter(ex => solvedExerciseIds.has(ex.id));
        } else if (filterStatus === 'unsolved') {
            result = result.filter(ex => !solvedExerciseIds.has(ex.id));
        }

        if (filterDifficulty !== null) {
            result = result.filter(ex => ex.difficulty === filterDifficulty);
        }

        if (sortOption === 'easy-first') {
            result.sort((a, b) => a.difficulty - b.difficulty);
        } else if (sortOption === 'hard-first') {
            result.sort((a, b) => b.difficulty - a.difficulty);
        }

        return result;
    }, [exercises, search, filterStatus, filterDifficulty, sortOption, solvedExerciseIds]);

    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкая", color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { label: "Средняя", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            { label: "Тяжелая", color: "bg-red-500/20 text-red-400 border-red-500/30" }
        ];
        return configs[difficulty] || configs[0];
    };

    const clearFilters = () => {
        setSearch("");
        setFilterStatus('all');
        setSortOption('default');
        setFilterDifficulty(null);
    };

    const hasActiveFilters = filterStatus !== 'all' || sortOption !== 'default' || filterDifficulty !== null;
    const hasAnyFilters = search || hasActiveFilters;

    const activeFiltersCount = [
        filterStatus !== 'all',
        sortOption !== 'default',
        filterDifficulty !== null
    ].filter(Boolean).length;

    if (isLoading || loadingStats) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Загрузка упражнений...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-sm w-full">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-400 font-medium">Ошибка загрузки данных</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-3 sm:p-4">
                        <p className="text-text/60 text-xs sm:text-sm">Всего</p>
                        <p className="text-xl sm:text-3xl font-bold text-primary">{totalExercises}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-3 sm:p-4">
                        <p className="text-text/60 text-xs sm:text-sm">Решено</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-400">{solvedCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-3 sm:p-4">
                        <p className="text-text/60 text-xs sm:text-sm">Прогресс</p>
                        <p className="text-xl sm:text-3xl font-bold text-accent">{progressPercent}%</p>
                    </div>
                </div>

                {totalExercises > 0 && (
                    <div className="mb-6 sm:mb-8">
                        <div className="flex justify-between text-xs sm:text-sm mb-2">
                            <span className="text-text/50">Общий прогресс</span>
                            <span className="text-text/70">{solvedCount} из {totalExercises}</span>
                        </div>
                        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-text">Список упражнений</h2>
                </div>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 bg-background border border-secondary/30 rounded-xl text-text text-sm sm:text-base placeholder-text/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-text/40 hover:text-text transition-colors"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`relative flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all ${
                            isFiltersOpen || hasActiveFilters
                                ? 'bg-accent/10 border-accent/50 text-accent'
                                : 'bg-background border-secondary/30 text-text/70 hover:border-accent/30 hover:text-text'
                        }`}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span className="hidden sm:inline text-sm font-medium">Фильтры</span>

                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-background text-xs font-bold rounded-full flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}

                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isFiltersOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'
                }`}>
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-text/50 mb-2">Статус</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFilterStatus('all')}
                                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                filterStatus === 'all'
                                                    ? 'bg-accent text-background'
                                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                            }`}
                                        >
                                            Все
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('unsolved')}
                                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                filterStatus === 'unsolved'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                            }`}
                                        >
                                            Нерешённые
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('solved')}
                                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                filterStatus === 'solved'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                            }`}
                                        >
                                            Решённые
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-xs text-text/50 mb-2">Сортировка</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSortOption('default')}
                                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                sortOption === 'default'
                                                    ? 'bg-accent text-background'
                                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                            }`}
                                        >
                                            По умолчанию
                                        </button>
                                        <button
                                            onClick={() => setSortOption('easy-first')}
                                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                sortOption === 'easy-first'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                            }`}
                                        >
                                            Сначала лёгкие
                                        </button>
                                        <button
                                            onClick={() => setSortOption('hard-first')}
                                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                sortOption === 'hard-first'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                            }`}
                                        >
                                            Сначала сложные
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-text/50 mb-2">Сложность</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilterDifficulty(null)}
                                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                            filterDifficulty === null
                                                ? 'bg-accent text-background'
                                                : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                        }`}
                                    >
                                        Любая
                                    </button>
                                    <button
                                        onClick={() => setFilterDifficulty(0)}
                                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                                            filterDifficulty === 0
                                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                                : 'bg-green-500/10 text-green-400/70 border-green-500/20 hover:bg-green-500/20'
                                        }`}
                                    >
                                        Лёгкая
                                    </button>
                                    <button
                                        onClick={() => setFilterDifficulty(1)}
                                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                                            filterDifficulty === 1
                                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                                : 'bg-yellow-500/10 text-yellow-400/70 border-yellow-500/20 hover:bg-yellow-500/20'
                                        }`}
                                    >
                                        Средняя
                                    </button>
                                    <button
                                        onClick={() => setFilterDifficulty(2)}
                                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                                            filterDifficulty === 2
                                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                                : 'bg-red-500/10 text-red-400/70 border-red-500/20 hover:bg-red-500/20'
                                        }`}
                                    >
                                        Сложная
                                    </button>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="pt-3 border-t border-secondary/20">
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Сбросить все фильтры
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!isFiltersOpen && hasAnyFilters && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                        <span className="text-xs text-text/50">Активные фильтры:</span>

                        {search && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/20 text-accent rounded-full">
                                Поиск: "{search.length > 15 ? search.slice(0, 15) + '...' : search}"
                                <button onClick={() => setSearch("")} className="hover:text-accent/70">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {filterStatus !== 'all' && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                                filterStatus === 'solved' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                                {filterStatus === 'solved' ? 'Решённые' : 'Нерешённые'}
                                <button onClick={() => setFilterStatus('all')} className="hover:opacity-70">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {sortOption !== 'default' && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                                sortOption === 'easy-first' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {sortOption === 'easy-first' ? 'Сначала лёгкие' : 'Сначала сложные'}
                                <button onClick={() => setSortOption('default')} className="hover:opacity-70">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {filterDifficulty !== null && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getDifficultyConfig(filterDifficulty).color}`}>
                                {getDifficultyConfig(filterDifficulty).label}
                                <button onClick={() => setFilterDifficulty(null)} className="hover:opacity-70">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        <span className="text-xs text-text/40 ml-auto">
                            Найдено: {filteredAndSorted.length}
                        </span>
                    </div>
                )}

                <div className="grid gap-3 sm:gap-4">
                    {filteredAndSorted.map((exercise, index) => {
                        const diffConfig = getDifficultyConfig(exercise.difficulty);
                        const isSolved = solvedExerciseIds.has(exercise.id);

                        return (
                            <Link
                                key={exercise.id}
                                to={`/exercise/${exercise.id}`}
                                className={`group block bg-background border rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-lg overflow-hidden ${
                                    isSolved
                                        ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/5'
                                        : 'border-secondary/20 hover:border-accent/50 hover:shadow-accent/5'
                                }`}
                            >
                                <div className="flex md:hidden flex-col gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                                isSolved
                                                    ? 'bg-green-500/20'
                                                    : 'bg-secondary/10 group-hover:bg-accent/20'
                                            }`}>
                                                {isSolved ? (
                                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-sm font-bold text-text/50 group-hover:text-accent transition-colors">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`font-medium transition-colors text-sm leading-tight line-clamp-2 break-words ${
                                                isSolved
                                                    ? 'text-text group-hover:text-green-400'
                                                    : 'text-text group-hover:text-accent'
                                            }`}>
                                                {exercise.title}
                                            </h3>
                                        </div>
                                        <svg
                                            className={`flex-shrink-0 w-5 h-5 transition-all mt-0.5 ${
                                                isSolved
                                                    ? 'text-green-400/50 group-hover:text-green-400'
                                                    : 'text-text/30 group-hover:text-accent'
                                            }`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${diffConfig.color}`}>
                                            {diffConfig.label}
                                        </span>
                                        {isSolved && (
                                            <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-500/10 rounded-full">
                                                Решено ✓
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center gap-4 overflow-hidden">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                        isSolved
                                            ? 'bg-green-500/20'
                                            : 'bg-secondary/10 group-hover:bg-accent/20'
                                    }`}>
                                        {isSolved ? (
                                            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <span className="text-lg font-bold text-text/50 group-hover:text-accent transition-colors">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <h3 className={`font-medium transition-colors truncate ${
                                            isSolved
                                                ? 'text-text group-hover:text-green-400'
                                                : 'text-text group-hover:text-accent'
                                        }`}>
                                            {exercise.title}
                                        </h3>
                                    </div>

                                    {isSolved && (
                                        <span className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-green-400 bg-green-500/10 rounded-full border border-green-500/20">
                                            Решено ✓
                                        </span>
                                    )}

                                    <div className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full border whitespace-nowrap ${diffConfig.color}`}>
                                        {diffConfig.label}
                                    </div>

                                    <svg
                                        className={`flex-shrink-0 w-5 h-5 group-hover:translate-x-1 transition-all ${
                                            isSolved
                                                ? 'text-green-400/50 group-hover:text-green-400'
                                                : 'text-text/30 group-hover:text-accent'
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        );
                    })}

                    {filteredAndSorted.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-text/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-text/50 mb-3">
                                {hasAnyFilters ? "По вашему запросу ничего не найдено" : "Заданий пока нет"}
                            </p>
                        </div>
                    )}
                </div>

                {exercises?.length === 0 && (
                    <div className="text-center py-16">
                        <svg className="w-16 h-16 text-text/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-text/50">Упражнения пока не добавлены</p>
                    </div>
                )}
            </main>
        </div>
    );
}