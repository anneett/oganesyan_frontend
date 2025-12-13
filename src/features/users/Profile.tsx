import { useGetUserProfileQuery, useGetUserStatsQuery, useUpdateUserMutation } from "./usersApi.ts";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export function Profile() {
    const { data: user, isLoading: loadingUser, error: errorUser } = useGetUserProfileQuery();
    const { data: stats, isLoading: loadingStats, error: errorStats } = useGetUserStatsQuery();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState("");
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    useEffect(() => {
        if (user?.userName) {
            setUserName(user.userName);
        }
    }, [user?.userName]);

    const hasError = errorUser || errorStats;

    const totalSolutions = stats?.length || 0;
    const correctSolutions = stats?.filter(s => s.isCorrect).length || 0;
    const successRate = totalSolutions > 0 ? Math.round((correctSolutions / totalSolutions) * 100) : 0;

    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкий", color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { label: "Средний", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            { label: "Сложный", color: "bg-red-500/20 text-red-400 border-red-500/30" }
        ];
        return configs[difficulty] || configs[0];
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setUpdateError(null);
        setUpdateSuccess(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setUserName(user?.userName || "");
        setUpdateError(null);
    };

    const handleSaveClick = async () => {
        if (!userName.trim()) {
            setUpdateError("Имя не может быть пустым");
            return;
        }

        if (userName.trim() === user?.userName) {
            setIsEditing(false);
            return;
        }

        try {
            await updateUser({ userName: userName.trim() }).unwrap();
            setIsEditing(false);
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error) {
            console.error("Ошибка обновления имени:", error);
            setUpdateError("Не удалось обновить имя");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    if (loadingUser) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Загрузка профиля...</p>
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

    if (hasError) {
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
            <main className="max-w-6xl mx-auto px-4 py-8">
                {updateSuccess && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="font-medium text-green-400">Имя успешно обновлено!</p>
                    </div>
                )}

                <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-secondary/20 rounded-2xl p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-4xl font-bold text-background uppercase">
                                {user?.userName?.charAt(0) || user?.login?.charAt(0) || "?"}
                            </span>
                        </div>

                        <div className="text-center sm:text-left flex-grow">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                            maxLength={50}
                                            className="px-3 py-2 bg-background border border-accent rounded-lg text-text text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/30 w-48 sm:w-64"
                                        />

                                        <button
                                            onClick={handleSaveClick}
                                            disabled={isUpdating}
                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                                            title="Сохранить"
                                        >
                                            {isUpdating ? (
                                                <div className="w-5 h-5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                            title="Отмена"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold text-text">
                                            {user?.userName}
                                        </h1>
                                        <button
                                            onClick={handleEditClick}
                                            className="p-2 text-text/40 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                                            title="Редактировать имя"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {updateError && (
                                <p className="text-red-400 text-sm mb-2">{updateError}</p>
                            )}

                            <p className="text-text/50 flex items-center justify-center sm:justify-start gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                @{user?.login}
                            </p>

                            {user?.isAdmin && (
                                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full border border-accent/30">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Администратор
                                </span>
                            )}
                        </div>

                        <div className="flex gap-4 sm:gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{totalSolutions}</p>
                                <p className="text-text/50 text-sm">Решений</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-400">{correctSolutions}</p>
                                <p className="text-text/50 text-sm">Верных</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-accent">{successRate}%</p>
                                <p className="text-text/50 text-sm">Успех</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-text/50">Прогресс правильных ответов</span>
                            <span className="text-text/70">{correctSolutions} из {totalSolutions}</span>
                        </div>
                        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                                style={{ width: `${successRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-text mb-2">История решений</h2>
                    <p className="text-text/50 text-sm">Все ваши попытки решения задач</p>
                </div>

                <div className="bg-background border border-secondary/20 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary/10 border-b border-secondary/20">
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                        Задание
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                        Сложность
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider hidden lg:table-cell">
                                        Правильный ответ
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider hidden lg:table-cell">
                                        Ваш ответ
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider">
                                        Результат
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase tracking-wider hidden md:table-cell">
                                        Дата
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/10">
                                {stats?.map((solution) => {
                                    const diffConfig = getDifficultyConfig(solution.exerciseDifficulty);
                                    return (
                                        <tr
                                            key={solution.solutionId}
                                            className="hover:bg-secondary/5 transition-colors"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${solution.isCorrect ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                    <span className="font-medium text-text">
                                                    {solution.exerciseTitle}
                                                </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${diffConfig.color}`}>
                                                {diffConfig.label}
                                            </span>
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                <code className="px-2 py-1 bg-secondary/10 rounded text-sm text-text/70 font-mono">
                                                    {solution.correctAnswer.length > 30
                                                        ? solution.correctAnswer.substring(0, 30) + "..."
                                                        : solution.correctAnswer}
                                                </code>
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                <code className={`px-2 py-1 rounded text-sm font-mono ${
                                                    solution.isCorrect
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {solution.userAnswer.length > 30
                                                        ? solution.userAnswer.substring(0, 30) + "..."
                                                        : solution.userAnswer}
                                                </code>
                                            </td>
                                            <td className="px-4 py-4">
                                                {solution.isCorrect ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Верно
                                                </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    Ошибка
                                                </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <div className="text-text/50 text-sm">
                                                    <p>{new Date(solution.submittedAt).toLocaleDateString('ru-RU')}</p>
                                                    <p className="text-text/30 text-xs">
                                                        {new Date(solution.submittedAt).toLocaleTimeString('ru-RU', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {stats?.length === 0 && (
                        <div className="text-center py-16">
                            <svg className="w-16 h-16 text-text/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <p className="text-text/50 mb-2">У вас пока нет решённых задач</p>
                            <Link
                                to="/exercises"
                                className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
                            >
                                Начать решать
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}