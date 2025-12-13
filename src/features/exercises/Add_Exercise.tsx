import { useState } from "react";
import * as React from "react";
import { useCreateExerciseMutation } from "./exercisesApi.ts";
import { Link } from "react-router-dom";

export const Add_Exercise = () => {
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState<number | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [success, setSuccess] = useState(false);

    const [createExercise, { error, isLoading }] = useCreateExerciseMutation();

    const difficulties = [
        { value: 0, label: "Легкий", color: "border-green-500 bg-green-500/10 text-green-400", activeColor: "border-green-500 bg-green-500/20 text-green-400 ring-2 ring-green-500/30" },
        { value: 1, label: "Средний", color: "border-yellow-500 bg-yellow-500/10 text-yellow-400", activeColor: "border-yellow-500 bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/30" },
        { value: 2, label: "Сложный", color: "border-red-500 bg-red-500/10 text-red-400", activeColor: "border-red-500 bg-red-500/20 text-red-400 ring-2 ring-red-500/30" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (difficulty === null) return;

        try {
            await createExercise({
                title,
                difficulty,
                correctAnswer,
            }).unwrap();

            setSuccess(true);
            setTitle("");
            setDifficulty(null);
            setCorrectAnswer("");

            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Ошибка добавления задания:", error);
        }
    };

    const isFormValid = title.trim() && difficulty !== null && correctAnswer.trim();

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-text mb-2">Новое задание</h1>
                    <p className="text-text/50">Создайте новое SQL-упражнение для студентов</p>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-green-400">Задание успешно создано!</p>
                            <p className="text-green-400/70 text-sm">Можете добавить ещё одно или вернуться к списку</p>
                        </div>
                    </div>
                )}

                <div className="bg-background border border-secondary/20 rounded-2xl p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text/70 mb-2">
                                Название задания
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Введите название задания..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 bg-background border border-secondary/30 rounded-xl text-text placeholder-text/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-text/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text/70 mb-3">
                                Уровень сложности
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff.value}
                                        type="button"
                                        onClick={() => setDifficulty(diff.value)}
                                        className={`px-4 py-3 rounded-xl border font-medium transition-all ${
                                            difficulty === diff.value
                                                ? diff.activeColor
                                                : `${diff.color} hover:opacity-80`
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            {diff.value === 0}
                                            {diff.value === 1}
                                            {diff.value === 2}
                                            <span className="text-sm">{diff.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text/70 mb-2">
                                Правильный ответ (SQL-запрос)
                            </label>
                            <div className="relative">
                                <textarea
                                    placeholder="Введите правильный ответ..."
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text placeholder-text/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-mono text-sm resize-none"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 bg-secondary/20 text-text/40 text-xs rounded-md font-mono">
                                        SQL
                                    </span>
                                </div>
                            </div>
                            <p className="mt-2 text-text/40 text-sm">
                                Введите эталонный SQL-запрос для проверки ответов студентов
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-400">Ошибка добавления задания. Попробуйте ещё раз.</p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !isFormValid}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:from-primary/50 disabled:to-primary/30 text-background font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                                        Добавление...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Создать задание
                                    </>
                                )}
                            </button>

                            <Link
                                to="/exercises"
                                className="py-3 px-6 border border-secondary/30 text-text/70 hover:text-text hover:bg-secondary/10 font-medium rounded-xl transition-all text-center"
                            >
                                Отмена
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};