import { useGetExercisesStatsQuery, useGetUsersStatsQuery } from './solutionsApi.ts';
import { useState } from "react";

export function Solutions() {
    const { data: exerciseStats, isLoading: loadingExercises, error: errorExercises } = useGetExercisesStatsQuery();
    const { data: userStats, isLoading: loadingUsers, error: errorUsers } = useGetUsersStatsQuery();

    const [search, setSearch] = useState("");
    const [showUserStats, setShowUserStats] = useState(false);

    const isLoading = loadingExercises || loadingUsers;
    const hasError = errorExercises || errorUsers;

    const filteredExercises = exerciseStats?.filter(stat =>
        stat.exerciseTitle.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const filteredUsers = userStats?.filter(stat =>
        stat.userLogin.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const totalExerciseAttempts = exerciseStats?.reduce((sum, s) => sum + s.totalAttempts, 0) || 0;
    const totalUserAttempts = userStats?.reduce((sum, s) => sum + s.totalAttempts, 0) || 0;

    const avgExercisePercent = exerciseStats && exerciseStats.length > 0
        ? Math.round(exerciseStats.reduce((sum, s) => sum + s.percentCorrect, 0) / exerciseStats.length)
        : 0;

    const avgUserPercent = userStats && userStats.length > 0
        ? Math.round(userStats.reduce((sum, s) => sum + s.percentCorrect, 0) / userStats.length)
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text mb-2">Статистика решений</h1>
                    <p className="text-text/50">
                        {showUserStats
                            ? "Успеваемость по пользователям"
                            : "Успеваемость по заданиям"
                        }
                    </p>
                </div>

                <button
                    onClick={() => {
                        setShowUserStats(!showUserStats);
                        setSearch("");
                    }}
                    className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
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
                            По заданиям ({exerciseStats?.length || 0})
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            По пользователям ({userStats?.length || 0})
                        </>
                    )}
                </button>
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
                                {showUserStats ? userStats?.length || 0 : exerciseStats?.length || 0}
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
                                    ? userStats?.reduce((sum, s) => sum + s.uniqueExercises, 0) || 0
                                    : exerciseStats?.reduce((sum, s) => sum + s.uniqueUsers, 0) || 0
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mb-6">
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

            {search && (
                <p className="text-text/50 text-sm mb-4">
                    Найдено: {showUserStats ? filteredUsers.length : filteredExercises.length} из {showUserStats ? userStats?.length : exerciseStats?.length}
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
                            filteredUsers.map((stat, index) => (
                                <tr key={stat.userId} className="hover:bg-secondary/5 transition-colors">
                                    <td className="px-4 py-4">
                                            <span className="text-text/40 font-mono text-sm">
                                                {index + 1}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-bold text-text uppercase">
                                                        {stat.userLogin.charAt(0)}
                                                    </span>
                                            </div>
                                            <span className="font-medium text-text">
                                                    {stat.userLogin}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-text/70">{stat.totalAttempts}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-text/70">{stat.uniqueExercises}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-green-400 font-medium">{stat.correctAnswers}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-grow h-2 bg-secondary/20 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(stat.percentCorrect)}`}
                                                    style={{ width: `${stat.percentCorrect}%` }}
                                                />
                                            </div>
                                            <span className={`px-2 py-1 text-sm font-bold rounded-lg min-w-[60px] text-center ${getPercentColor(stat.percentCorrect)}`}>
                                                    {stat.percentCorrect}%
                                                </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            filteredExercises.map((stat, index) => (
                                <tr key={stat.exerciseId} className="hover:bg-secondary/5 transition-colors">
                                    <td className="px-4 py-4">
                                            <span className="text-text/40 font-mono text-sm">
                                                {index + 1}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">
                                                        #{stat.exerciseId}
                                                    </span>
                                            </div>
                                            <span className="font-medium text-text">
                                                    {stat.exerciseTitle}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-text/70">{stat.totalAttempts}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-text/70">{stat.uniqueUsers}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-green-400 font-medium">{stat.correctAnswers}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-grow h-2 bg-secondary/20 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(stat.percentCorrect)}`}
                                                    style={{ width: `${stat.percentCorrect}%` }}
                                                />
                                            </div>
                                            <span className={`px-2 py-1 text-sm font-bold rounded-lg min-w-[60px] text-center ${getPercentColor(stat.percentCorrect)}`}>
                                                    {stat.percentCorrect}%
                                                </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {((showUserStats && filteredUsers.length === 0) || (!showUserStats && filteredExercises.length === 0)) && (
                    <div className="text-center py-12">
                        <svg className="w-12 h-12 text-text/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-text/50">
                            {search
                                ? "Ничего не найдено"
                                : showUserStats
                                    ? "Нет данных по пользователям"
                                    : "Нет данных по заданиям"
                            }
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="mt-3 text-accent hover:text-accent/80 text-sm transition-colors"
                            >
                                Сбросить поиск
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}