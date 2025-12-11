import { useGetExercisesQuery } from "./exercisesApi.ts";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export function Exercises() {
    const { data: exercises, isLoading, error } = useGetExercisesQuery();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const filtered = exercises?.filter(exercise =>
        exercise.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
    };

    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкая", color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { label: "Средняя", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            { label: "Тяжелая", color: "bg-red-500/20 text-red-400 border-red-500/30" }
        ];
        return configs[difficulty] || configs[0];
    };

    if (isLoading) {
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
            <div className="min-h-screen bg-background flex items-center justify-center">
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
        <div className="min-h-screen bg-background">
            <header className="border-b border-secondary/20 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        SQL-тренажер
                    </h1>

                    <nav className="flex items-center gap-2">
                        <Link
                            to="/profile"
                            className="px-4 py-2 text-text/70 hover:text-text hover:bg-secondary/20 rounded-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="hidden sm:inline">Профиль</span>
                        </Link>

                        <Link
                            to="/users"
                            className="px-4 py-2 text-text/70 hover:text-text hover:bg-secondary/20 rounded-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="hidden sm:inline">Пользователи</span>
                        </Link>

                        <Link
                            to="/add-exercise"
                            className="px-4 py-2 text-text/70 hover:text-text hover:bg-secondary/20 rounded-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="hidden sm:inline">Добавить задание</span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Выйти</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Всего заданий</p>
                        <p className="text-3xl font-bold text-primary">{exercises?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Выполнено</p>
                        <p className="text-3xl font-bold text-secondary">0</p>
                    </div>
                    <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-4">
                        <p className="text-text/60 text-sm">Прогресс</p>
                        <p className="text-3xl font-bold text-accent">0%</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text">Список упражнений</h2>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Легкие</span>
                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">Средние</span>
                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">Тяжелые</span>
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
                        placeholder="Поиск по названию..."
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
                        Найдено: {filtered?.length || 0} из {exercises?.length || 0}
                    </p>
                )}

                <div className="grid gap-4">
                    {filtered?.map((exercise, index) => {
                        const diffConfig = getDifficultyConfig(exercise.difficulty);
                        return (
                            <Link
                                key={exercise.id}
                                to={`/exercise/${exercise.id}`}
                                className="group block bg-background border border-secondary/20 hover:border-accent/50 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 group-hover:bg-accent/20 rounded-xl flex items-center justify-center transition-colors">
                                        <span className="text-lg font-bold text-text/50 group-hover:text-accent transition-colors">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-medium text-text group-hover:text-accent transition-colors truncate">
                                            {exercise.title}
                                        </h3>
                                    </div>

                                    <div className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full border ${diffConfig.color}`}>
                                        {diffConfig.label}
                                    </div>

                                    <svg
                                        className="flex-shrink-0 w-5 h-5 text-text/30 group-hover:text-accent group-hover:translate-x-1 transition-all"
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

                    {filtered?.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-text/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-text/50">
                                {search ? "Задания не найдены" : "Задания пока нет"}
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