import { useGetExerciseByIdQuery, useGetExerciseStatsQuery } from "./exercisesApi.ts";
import { useCreateSolutionMutation } from "../solutions/solutionsApi.ts";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import * as React from "react";

export function Exercise() {
    const { id } = useParams();
    const { data: exercise, isLoading: loadingExercise, error: errorExercise } = useGetExerciseByIdQuery(Number(id));
    const { data: stats, isLoading: loadingStats, error: errorStats } = useGetExerciseStatsQuery(Number(id));

    const [createSolution, { data: solution, isLoading: isSubmitting }] = useCreateSolutionMutation();
    const [answer, setAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [showStats, setShowStats] = useState(false);

    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкая", color: "bg-green-500/20 text-green-400 border-green-500/30"},
            { label: "Средняя", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"},
            { label: "Тяжелая", color: "bg-red-500/20 text-red-400 border-red-500/30"}
        ];
        return configs[difficulty] || configs[0];
    };

    if (loadingExercise) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Загрузка задания...</p>
                </div>
            </div>
        );
    }

    if (errorExercise) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-400 font-medium">Ошибка загрузки задания</p>
                    <Link to="/exercises" className="mt-4 inline-block text-accent hover:text-accent/80 transition-colors">
                        Вернуться к списку
                    </Link>
                </div>
            </div>
        );
    }

    if (loadingStats) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Загрузка статистики...</p>
                </div>
            </div>
        );
    }

    if (errorStats) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-400 font-medium">Ошибка загрузки статистики</p>
                </div>
            </div>
        );
    }

    if (!exercise) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 text-text/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-text/50 mb-4">Задание не найдено</p>
                    <Link to="/exercises" className="text-accent hover:text-accent/80 transition-colors">
                        Вернуться к списку
                    </Link>
                </div>
            </div>
        );
    }

    const diffConfig = getDifficultyConfig(exercise.difficulty);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim()) return;

        try {
            await createSolution({
                exerciseId: exercise.id,
                userAnswer: answer,
            }).unwrap();
        } catch (error) {
            console.error("Ошибка отправки решения:", error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-secondary/20 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        SQL-тренажер
                    </h1>

                    <Link
                        to="/exercises"
                        className="px-4 py-2 text-text/70 hover:text-text hover:bg-secondary/20 rounded-lg transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="hidden sm:inline">К заданиям</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-gradient-to-br from-secondary/10 via-background to-primary/5 border border-secondary/20 rounded-2xl p-6 sm:p-8 mb-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary">#{id}</span>
                            </div>
                            <div>
                                <p className="text-text/50 text-sm">Задание</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-full border ${diffConfig.color}`}>
                                    {diffConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-4">
                            {exercise.title}
                        </h1>

                        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-text/60 text-sm">
                                        Напишите SQL-запрос, который решает поставленную задачу.
                                        Проверьте синтаксис перед отправкой.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text/70 mb-2">
                                Ваш SQL-запрос
                            </label>
                            <div className="relative">
                                <textarea
                                    placeholder="Введите ответ..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text placeholder-text/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-mono text-sm resize-none"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 bg-secondary/20 text-text/40 text-xs rounded-md font-mono">
                                        SQL
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !answer.trim()}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:from-primary/50 disabled:to-primary/30 text-background font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                                    Проверка...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Отправить решение
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {solution && (
                    <div className={`border rounded-2xl p-6 sm:p-8 mb-6 ${
                        solution.isCorrect
                            ? 'bg-green-500/5 border-green-500/30'
                            : 'bg-red-500/5 border-red-500/30'
                    }`}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                solution.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                                {solution.isCorrect ? (
                                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${
                                    solution.isCorrect ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {solution.isCorrect ? 'Правильно!' : 'Неправильно'}
                                </h2>
                                <p className="text-text/50">{solution.result}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-medium text-text/70 mb-2">Ваш ответ:</p>
                            <div className={`p-4 rounded-xl font-mono text-sm ${
                                solution.isCorrect
                                    ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                            }`}>
                                {solution.userAnswer}
                            </div>
                        </div>

                        {!solution.isCorrect && (
                            <button
                                onClick={() => setShowAnswer(!showAnswer)}
                                className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-text/70 hover:text-text rounded-lg transition-all"
                            >
                                <svg className={`w-5 h-5 transition-transform ${showAnswer ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                {showAnswer ? 'Скрыть правильный ответ' : 'Показать правильный ответ'}
                            </button>
                        )}
                    </div>
                )}

                {showAnswer && (
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-2xl p-6 sm:p-8 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-green-400 mb-3">Правильный ответ:</h3>
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl font-mono text-sm text-green-300">
                                    {exercise.correctAnswer}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {solution && !solution.isCorrect && (
                    <div className="text-center">
                        <button onClick={() => { setAnswer(""); setShowAnswer(false); }}
                            className="px-6 py-3 bg-accent/20 hover:bg-accent/30 text-accent font-medium rounded-xl transition-all inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Попробовать ещё раз
                        </button>
                    </div>
                )}

                {solution?.isCorrect && stats && stats.percentCorrect > 0 && (
                    <div className="mb-6 p-5 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border border-accent/30 rounded-2xl">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-semibold text-text">
                                    Вы вошли в <span className="text-accent font-bold">{Math.round(stats.percentCorrect)}%</span> правильно решивших!
                                </p>
                                <p className="text-text/50 text-sm">
                                    Отличная работа! Продолжайте в том же духе
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center mb-4">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="px-5 py-2.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-text/70 hover:text-text font-medium rounded-xl transition-all inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {showStats ? 'Скрыть статистику' : 'Показать статистику'}
                        <svg className={`w-4 h-4 transition-transform duration-200 ${showStats ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {showStats && stats && stats.totalAttempts !== 0 && (
                    <div className="bg-gradient-to-br from-secondary/10 via-background to-accent/5 border border-secondary/20 rounded-2xl p-6 sm:p-8 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text">Статистика задания</h3>
                                <p className="text-text/50 text-sm">Как другие справляются с этим заданием</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-background/50 border border-secondary/20 rounded-xl p-4 text-center">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-text">{stats.totalAttempts}</p>
                                <p className="text-text/50 text-sm">Всего попыток</p>
                            </div>

                            <div className="bg-background/50 border border-secondary/20 rounded-xl p-4 text-center">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-text">{stats.uniqueUsers}</p>
                                <p className="text-text/50 text-sm">Участников</p>
                            </div>

                            <div className="bg-background/50 border border-secondary/20 rounded-xl p-4 text-center">
                                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-green-400">{stats.correctAnswers}</p>
                                <p className="text-text/50 text-sm">Верных ответов</p>
                            </div>

                            <div className="bg-background/50 border border-secondary/20 rounded-xl p-4 text-center">
                                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-accent">{stats.percentCorrect.toFixed(1)}%</p>
                                <p className="text-text/50 text-sm">Успешность</p>
                            </div>
                        </div>

                        <div className="bg-background/50 border border-secondary/20 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-text/70">Процент правильных решений</span>
                                <span className="text-sm font-bold text-accent">{stats.percentCorrect.toFixed(1)}%</span>
                            </div>
                            <div className="h-3 bg-secondary/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${stats.percentCorrect}%`,
                                        background: stats.percentCorrect >= 70
                                            ? 'linear-gradient(to right, #22c55e, #10b981)'
                                            : stats.percentCorrect >= 40
                                                ? 'linear-gradient(to right, #eab308, #f59e0b)'
                                                : 'linear-gradient(to right, #ef4444, #f97316)'
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-text/40">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-background/30 rounded-xl border border-secondary/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-text/50 text-sm">Оценка сложности:</span>
                                    {stats.percentCorrect >= 70 ? (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                                            Легко для большинства
                                        </span>
                                    ) : stats.percentCorrect >= 40 ? (
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
                                            Средняя сложность
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                                            Сложно для многих
                                        </span>
                                    )}
                                </div>
                                {stats.totalAttempts > 0 && (
                                    <span className="text-text/40 text-xs">
                                        В среднем {(stats.totalAttempts / stats.uniqueUsers).toFixed(1)} попыток на человека
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showStats && stats && stats.totalAttempts === 0 && (
                    <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-8 text-center">
                        <svg className="w-12 h-12 text-text/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-text/50">Статистика пока недоступна</p>
                        <p className="text-text/30 text-sm mt-1">Станьте первым, кто решит это задание!</p>
                    </div>
                )}

                {solution?.isCorrect && (
                    <div className="text-center mt-6">
                        <Link
                            to="/exercises"
                            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-background font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 inline-flex items-center gap-2"
                        >
                            Следующее задание
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}