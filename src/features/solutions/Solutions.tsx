import { useGetExercisesStatsQuery, useGetUsersStatsQuery } from './solutionsApi';
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";

type SortSuccess = 'default' | 'high-first' | 'low-first';
type SortAttempts = 'default' | 'most-first' | 'least-first';
type SortDifficulty = 'default' | 'easy-first' | 'hard-first';

export function Solutions() {
    const [search, setSearch] = useState("");
    const [showUserStats, setShowUserStats] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [sortSuccess, setSortSuccess] = useState<SortSuccess>('default');
    const [sortAttempts, setSortAttempts] = useState<SortAttempts>('default');
    const [sortDifficulty, setSortDifficulty] = useState<SortDifficulty>('default');

    const [selectedDatabaseMetaId, setSelectedDatabaseMetaId] = useState<number | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

    const { data: dbData } = useGetDatabaseMetasQuery();
    const databases = Array.isArray(dbData) ? dbData : [];

    const { data: exData, isLoading: loadingExercises, error: errorExercises } = useGetExercisesStatsQuery(
        selectedDatabaseMetaId ? { databaseMetaId: selectedDatabaseMetaId } : undefined,
    );
    const exerciseStats = Array.isArray(exData) ? exData : [];

    const { data: usData, isLoading: loadingUsers, error: errorUsers } = useGetUsersStatsQuery(
        selectedDatabaseMetaId ? { databaseMetaId: selectedDatabaseMetaId } : undefined,
    );
    const userStats = Array.isArray(usData) ? usData : [];

    const isLoading = loadingExercises || loadingUsers;
    const hasError = errorExercises || errorUsers;

    const filteredExercises = exerciseStats.filter(stat => {
        if (!stat) return false;
        if (
            selectedDifficulty !== null &&
            stat.exerciseDifficulty !== selectedDifficulty
        ) {
            return false;
        }
        const title = String(stat.exerciseTitle || "Без названия").toLowerCase();
        const query = String(search || "").toLowerCase();
        return title.includes(query);
    });

    const filteredUsers = userStats.filter(stat => {
        if (!stat) return false;
        const login = String(stat.userLogin || "Неизвестный").toLowerCase();
        const query = String(search || "").toLowerCase();
        return login.includes(query);
    });

    const sortedExercises = useMemo(() => {
        if (sortSuccess === 'default' && sortAttempts === 'default' && sortDifficulty === 'default') return filteredExercises;

        return [...filteredExercises].sort((a, b) => {
            if (sortSuccess === 'high-first') {
                const diff = (Number(b?.percentCorrect) || 0) - (Number(a?.percentCorrect) || 0);
                if (diff !== 0) return diff;
            } else if (sortSuccess === 'low-first') {
                const diff = (Number(a?.percentCorrect) || 0) - (Number(b?.percentCorrect) || 0);
                if (diff !== 0) return diff;
            }

            if (sortAttempts === 'most-first') {
                return (Number(b?.totalAttempts) || 0) - (Number(a?.totalAttempts) || 0);
            } else if (sortAttempts === 'least-first') {
                return (Number(a?.totalAttempts) || 0) - (Number(b?.totalAttempts) || 0);
            }

            if (sortDifficulty === 'easy-first') {
                const diff = a.exerciseDifficulty - b.exerciseDifficulty;
                if (diff !== 0) return diff;
            } else if (sortDifficulty === 'hard-first') {
                const diff = b.exerciseDifficulty - a.exerciseDifficulty;
                if (diff !== 0) return diff;
            }

            return 0;
        });
    }, [filteredExercises, sortSuccess, sortAttempts, sortDifficulty]);

    const sortedUsers = useMemo(() => {
        if (sortSuccess === 'default' && sortAttempts === 'default') return filteredUsers;

        return [...filteredUsers].sort((a, b) => {
            if (sortSuccess === 'high-first') {
                const diff = (Number(b?.percentCorrect) || 0) - (Number(a?.percentCorrect) || 0);
                if (diff !== 0) return diff;
            } else if (sortSuccess === 'low-first') {
                const diff = (Number(a?.percentCorrect) || 0) - (Number(b?.percentCorrect) || 0);
                if (diff !== 0) return diff;
            }

            if (sortAttempts === 'most-first') {
                return (Number(b?.totalAttempts) || 0) - (Number(a?.totalAttempts) || 0);
            } else if (sortAttempts === 'least-first') {
                return (Number(a?.totalAttempts) || 0) - (Number(b?.totalAttempts) || 0);
            }

            return 0;
        });
    }, [filteredUsers, sortSuccess, sortAttempts]);

    const totalExerciseAttempts = exerciseStats.reduce((sum, s) => sum + (Number(s?.totalAttempts) || 0), 0);
    const totalUserAttempts = userStats.reduce((sum, s) => sum + (Number(s?.totalAttempts) || 0), 0);

    const avgExercisePercent = exerciseStats.length > 0
        ? Math.round(exerciseStats.reduce((sum, s) => sum + (Number(s?.percentCorrect) || 0), 0) / exerciseStats.length)
        : 0;

    const avgUserPercent = userStats.length > 0
        ? Math.round(userStats.reduce((sum, s) => sum + (Number(s?.percentCorrect) || 0), 0) / userStats.length)
        : 0;

    const getPercentColor = (percent: number) => {
        if (percent >= 70) return "text-green-400 bg-green-500/20";
        if (percent >= 40) return "text-yellow-400 bg-yellow-500/20";
        return "text-red-400 bg-red-500/20";
    };

    const getProgressBarColor = (percent: number) => {
        if (percent >= 70) return "bg-gradient-to-r from-green-500 to-green-400";
        if (percent >= 40) return "bg-gradient-to-r from-yellow-500 to-yellow-400";
        return "bg-gradient-to-r from-red-500 to-red-400";
    };

    const getDifficultyConfig = (difficulty: number) => {
        const configs = {
            1: {
                label: "Легкая",
                color: "bg-green-500/20 text-green-400 border-green-500/30"
            },
            2: {
                label: "Средняя",
                color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            },
            3: {
                label: "Сложная",
                color: "bg-red-500/20 text-red-400 border-red-500/30"
            }
        };
        return configs[difficulty as keyof typeof configs] ?? configs[1];
    };

    const clearFilters = () => {
        setSortSuccess('default');
        setSortAttempts('default');
        setSortDifficulty('default');
        setSelectedDifficulty(null);
    };

    const hasActiveFilters = sortSuccess !== 'default' || sortAttempts !== 'default' || sortDifficulty !== 'default' || selectedDifficulty !== null;

    const activeFiltersCount = [
        sortSuccess !== 'default',
        sortAttempts !== 'default',
        sortDifficulty !== 'default',
        selectedDifficulty !== null
    ].filter(Boolean).length;

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Загрузка статистики...</p>
                </div>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
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
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text mb-2">Статистика решений</h1>
                    <p className="text-text/50">
                        {showUserStats
                            ? "Успеваемость по пользователям"
                            : "Успеваемость по заданиям"
                        }
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={selectedDatabaseMetaId ?? ""}
                        onChange={(event) => setSelectedDatabaseMetaId(event.target.value ? Number(event.target.value) : null)}
                        className="px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text focus:outline-none focus:border-accent"
                    >
                        <option value="">По всем базам данных</option>
                        {databases.map((database) => (
                            <option key={database?.id} value={database?.id}>
                                {database?.logicalName}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedDifficulty ?? ""}
                        onChange={(e) =>
                            setSelectedDifficulty(
                                e.target.value ? Number(e.target.value) : null
                            )
                        }
                        className="px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text focus:outline-none focus:border-accent"
                    >
                        <option value="">Любая сложность</option>
                        <option value="1">Легкая</option>
                        <option value="2">Средняя</option>
                        <option value="3">Сложная</option>
                    </select>

                    <button
                        onClick={() => {
                            setShowUserStats(!showUserStats);
                            setSearch("");
                        }}
                        className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                            showUserStats
                                ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                                : "bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30"
                        }`}
                    >
                        {showUserStats ? (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                По заданиям ({exerciseStats.length})
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                По пользователям ({userStats.length})
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-text/50 text-sm">
                                {showUserStats ? "Пользователей" : "Заданий"}
                            </p>
                            <p className="text-2xl font-bold text-secondary">
                                {showUserStats ? userStats.length : exerciseStats.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-text/50 text-sm">Всего попыток</p>
                            <p className="text-2xl font-bold text-blue-400">
                                {showUserStats ? totalUserAttempts : totalExerciseAttempts}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-text/50 text-sm">Средний %</p>
                            <p className="text-2xl font-bold text-green-400">
                                {showUserStats ? avgUserPercent : avgExercisePercent}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-text/50 text-sm">
                                {showUserStats ? "Уник. заданий" : "Уник. участников"}
                            </p>
                            <p className="text-2xl font-bold text-accent">
                                {showUserStats
                                    ? userStats.reduce((sum, s) => sum + (Number(s?.uniqueExercises) || 0), 0)
                                    : exerciseStats.reduce((sum, s) => sum + (Number(s?.uniqueUsers) || 0), 0)
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={showUserStats ? "Поиск по логину..." : "Поиск по названию задания..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-secondary/30 rounded-xl text-text placeholder-text/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text/40 hover:text-text transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${
                        isFiltersOpen || hasActiveFilters
                            ? 'bg-accent/10 border-accent/50 text-accent'
                            : 'bg-background border-secondary/30 text-text/70 hover:border-accent/30 hover:text-text'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-sm font-medium">Сортировка</span>

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
                isFiltersOpen ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs text-text/50 mb-2">По успешности</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSortSuccess('default')}
                                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                        sortSuccess === 'default'
                                            ? 'bg-accent text-background'
                                            : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                    }`}
                                >
                                    Без сортировки
                                </button>

                                <button
                                    onClick={() => setSortSuccess('high-first')}
                                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                                        sortSuccess === 'high-first' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                    }`}
                                >
                                    Сначала успешные
                                </button>

                                <button
                                    onClick={() => setSortSuccess('low-first')}
                                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                                        sortSuccess === 'low-first' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                    }`}
                                >
                                    Сначала неуспешные
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-text/50 mb-2">По количеству попыток</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSortAttempts('default')}
                                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                        sortAttempts === 'default'
                                            ? 'bg-accent text-background'
                                            : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                    }`}
                                >
                                    Без сортировки
                                </button>

                                <button
                                    onClick={() => setSortAttempts('most-first')}
                                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                                        sortAttempts === 'most-first' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                    }`}
                                >
                                    Сначала больше попыток
                                </button>

                                <button
                                    onClick={() => setSortAttempts('least-first')}
                                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                                        sortAttempts === 'least-first' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'
                                    }`}
                                >
                                    Сначала меньше попыток
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-text/50 mb-2">По сложности</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSortDifficulty('default')} className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${sortDifficulty === 'default' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Без сортировки</button>
                                <button onClick={() => setSortDifficulty('easy-first')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDifficulty === 'easy-first' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Сначала легкие</button>
                                <button onClick={() => setSortDifficulty('hard-first')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDifficulty === 'hard-first' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Сначала сложные</button>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="pt-3 border-t border-secondary/20">
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    Сбросить сортировку
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!isFiltersOpen && hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                    <span className="text-xs text-text/50">Сортировка:</span>

                    {sortSuccess !== 'default' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            sortSuccess === 'high-first' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {sortSuccess === 'high-first' ? 'Сначала успешные' : 'Сначала неуспешные'}
                                        <button onClick={() => setSortSuccess('default')} className="hover:opacity-70">
                                ✕
                            </button>
                        </span>
                    )}

                    {sortAttempts !== 'default' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            sortAttempts === 'most-first'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {sortAttempts === 'most-first' ? 'Больше попыток' : 'Меньше попыток'}
                                        <button onClick={() => setSortAttempts('default')} className="hover:opacity-70">
                                ✕
                            </button>
                        </span>
                    )}

                    {sortDifficulty !== 'default' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            sortDifficulty === 'hard-first' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                            {sortDifficulty === 'easy-first' ? 'Сначала легкие' : 'Сначала сложные'}
                            <button onClick={() => setSortDifficulty('default')} className="hover:opacity-70">
                                ✕
                            </button>
                        </span>
                    )}
                </div>
            )}

            {search && (
                <p className="text-text/50 text-sm mb-4">
                    Найдено: {showUserStats ? sortedUsers.length : sortedExercises.length} из{" "}
                    {showUserStats ? userStats.length : exerciseStats.length}
                </p>
            )}

            <div className="bg-background border border-secondary/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-secondary/10 border-b border-secondary/20">
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                {showUserStats ? "Пользователь" : "Задание"}
                            </th>
                            {!showUserStats && (
                                <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider hidden md:table-cell">
                                    База данных
                                </th>
                            )}
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                Сложность
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                Попыток
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                {showUserStats ? "Заданий" : "Участников"}
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                Верных
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider min-w-[200px]">
                                Успешность
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-secondary/10">
                        {showUserStats ? (
                            sortedUsers.map((stat, index) => (
                                <tr key={stat.userId || index} className="hover:bg-secondary/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <span className="text-text/40 font-mono text-sm">{index + 1}</span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-text uppercase">
                                        {(stat.userLogin || "?").charAt(0)}
                                    </span>
                                            </div>
                                            <Link to={`/users/${stat.userId}`} className="font-medium text-text transition hover:text-accent">
                                                {stat.userLogin || "Неизвестный"}
                                            </Link>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-text/70">{stat.totalAttempts || 0}</td>
                                    <td className="px-4 py-4 text-text/70">{stat.uniqueExercises || 0}</td>
                                    <td className="px-4 py-4 text-green-400 font-medium">{stat.correctAnswers || 0}</td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-grow h-2 bg-secondary/20 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(stat.percentCorrect || 0)}`}
                                                    style={{ width: `${stat.percentCorrect || 0}%` }}
                                                />
                                            </div>
                                            <span className={`px-2 py-1 text-sm font-bold rounded-lg min-w-[60px] text-center ${getPercentColor(stat.percentCorrect || 0)}`}>
                                    {stat.percentCorrect || 0}%
                                </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            sortedExercises.map((stat, index) => {
                                const dbName = databases.find(db => db.id === stat.databaseMetaId)?.logicalName || "Неизвестно";
                                const diffConfig = getDifficultyConfig(stat.exerciseDifficulty);

                                return (
                                    <tr key={stat.exerciseId || index} className="hover:bg-secondary/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <span className="text-text/40 font-mono text-sm">{index + 1}</span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">
                                                        #{stat.exerciseId}
                                                    </span>
                                                </div>
                                                <Link to={`/exercise/${stat.exerciseId}`} className="font-medium text-text hover:text-accent transition-colors">
                                                    {stat.exerciseTitle || "Без названия"}
                                                </Link>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <span className="inline-flex max-w-[160px] truncate px-2 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-medium">
                                                {dbName}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${diffConfig.color}`}>
                                                {diffConfig.label}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-text/70">{stat.totalAttempts || 0}</td>
                                        <td className="px-4 py-4 text-text/70">{stat.uniqueUsers || 0}</td>
                                        <td className="px-4 py-4 text-green-400 font-medium">{stat.correctAnswers || 0}</td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-grow h-2 bg-secondary/20 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(stat.percentCorrect || 0)}`}
                                                        style={{ width: `${stat.percentCorrect || 0}%` }}
                                                    />
                                                </div>
                                                <span className={`px-2 py-1 text-sm font-bold rounded-lg min-w-[60px] text-center ${getPercentColor(stat.percentCorrect || 0)}`}>
                                        {stat.percentCorrect || 0}%
                                    </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {((showUserStats && sortedUsers.length === 0) || (!showUserStats && sortedExercises.length === 0)) && (
                    <div className="text-center py-12">
                        <p className="text-text/50">
                            {search
                                ? "Ничего не найдено"
                                : showUserStats
                                    ? "Нет данных по пользователям"
                                    : "Нет данных по заданиям"
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}