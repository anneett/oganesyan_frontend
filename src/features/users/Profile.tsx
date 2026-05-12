import { useGetUserProfileQuery, useGetUserStatsQuery, useUpdateUserMutation } from "./usersApi";
import { useState, useMemo } from "react";
import * as React from "react";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";

type SortDate = 'newest' | 'oldest';
type SortCorrectness = 'all' | 'correct-first' | 'incorrect-first';
type SortDifficulty = 'default' | 'easy-first' | 'hard-first';

export function Profile() {
    const { data: user, isLoading: loadingUser, error: errorUser } = useGetUserProfileQuery();

    const [searchTitle, setSearchTitle] = useState("");
    const [selectedDbId, setSelectedDbId] = useState<number | null>(null);

    const { data: databases = [] } = useGetDatabaseMetasQuery();
    const { data: stats, isLoading: loadingStats, error: errorStats } = useGetUserStatsQuery(
        selectedDbId ? { databaseMetaId: selectedDbId } : undefined
    );
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState("");
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [sortDate, setSortDate] = useState<SortDate>('newest');
    const [sortCorrectness, setSortCorrectness] = useState<SortCorrectness>('all');
    const [sortDifficulty, setSortDifficulty] = useState<SortDifficulty>('default');

    const hasError = errorUser || errorStats;

    const totalSolutions = stats?.length || 0;
    const correctSolutions = stats?.filter(s => s.isCorrect).length || 0;
    const successRate = totalSolutions > 0 ? Math.round((correctSolutions / totalSolutions) * 100) : 0;

    const solvedExerciseIds = useMemo(() => {
        if (!stats) return new Set<number>();
        return new Set(stats.filter(s => s.isCorrect).map(s => s.exerciseId));
    }, [stats]);

    const filteredAndSortedStats = useMemo(() => {
        if (!stats) return [];

        let result = [...stats];

        if (searchTitle) {
            result = result.filter(s => s.exerciseTitle.toLowerCase().includes(searchTitle.toLowerCase()));
        }

        return result.sort((a, b) => {
            if (sortCorrectness === 'correct-first') {
                const correctDiff = (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0);
                if (correctDiff !== 0) return correctDiff;
            } else if (sortCorrectness === 'incorrect-first') {
                const correctDiff = (a.isCorrect ? 1 : 0) - (b.isCorrect ? 1 : 0);
                if (correctDiff !== 0) return correctDiff;
            }

            if (sortDifficulty === 'easy-first') {
                const diffDiff = a.exerciseDifficulty - b.exerciseDifficulty;
                if (diffDiff !== 0) return diffDiff;
            } else if (sortDifficulty === 'hard-first') {
                const diffDiff = b.exerciseDifficulty - a.exerciseDifficulty;
                if (diffDiff !== 0) return diffDiff;
            }

            if (sortDate === 'newest') {
                return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            } else {
                return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
            }
        });
    }, [stats, searchTitle, sortDate, sortCorrectness, sortDifficulty]);

    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкий", color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { label: "Средний", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            { label: "Сложный", color: "bg-red-500/20 text-red-400 border-red-500/30" }
        ];
        return configs[difficulty] || configs[0];
    };

    const hasActiveFilters = sortDate !== 'newest' || sortCorrectness !== 'all' || sortDifficulty !== 'default';

    const handleEditClick = () => {
        setIsEditing(true);
        setUserName(user?.userName ?? "");
        console.error(null);
        setUpdateSuccess(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (user?.userName) {
            setUserName(user.userName);
        }
        console.error(null);
    };

    const handleSaveClick = async () => {
        if (!userName.trim()) return console.error("Имя не может быть пустым");
        if (userName.trim() === user?.userName) return setIsEditing(false);

        try {
            await updateUser({ userName: userName.trim() }).unwrap();
            setIsEditing(false);
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error) {
            console.error("Не удалось обновить имя");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') void handleSaveClick();
        else if (e.key === 'Escape') handleCancelEdit();
    };

    if (loadingUser || loadingStats) return <div className="min-h-screen bg-background flex items-center justify-center text-text/70">Загрузка профиля...</div>;
    if (hasError) return <div className="min-h-screen bg-background flex items-center justify-center text-red-400">Ошибка загрузки данных</div>;

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
                                            className="px-3 py-2 bg-background border border-accent rounded-lg text-text text-2xl font-bold w-48 sm:w-64"
                                        />
                                        <button onClick={handleSaveClick} disabled={isUpdating} className="p-2 bg-green-500/20 text-green-400 rounded-lg">✓</button>
                                        <button onClick={handleCancelEdit} className="p-2 bg-red-500/20 text-red-400 rounded-lg">✕</button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold text-text">{user?.userName}</h1>
                                        <button onClick={handleEditClick} className="text-text/40 hover:text-accent px-2">✎</button>
                                    </>
                                )}
                            </div>
                            <p className="text-text/50">@{user?.login}</p>
                            {user?.isAdmin && <span className="mt-2 inline-block px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full border border-accent/30">Администратор</span>}
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
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Поиск по названию задания..."
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        className="flex-grow px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text focus:border-accent"
                    />
                    <select
                        value={selectedDbId ?? ""}
                        onChange={(e) => setSelectedDbId(e.target.value ? Number(e.target.value) : null)}
                        className="px-4 py-3 bg-background border border-secondary/30 rounded-xl text-text focus:border-accent"
                    >
                        <option value="">Все базы данных</option>
                        {databases.map(db => <option key={db.id} value={db.id}>{db.logicalName}</option>)}
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-text">История решений</h2>
                    </div>

                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`px-4 py-2 rounded-xl border ${isFiltersOpen || hasActiveFilters ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-secondary/30 text-text/70'}`}
                    >
                        Сортировка
                    </button>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${isFiltersOpen ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex gap-4 flex-wrap">
                        <div className="flex gap-2">
                            <button onClick={() => setSortDate('newest')} className={`px-3 py-1.5 rounded-lg text-sm ${sortDate === 'newest' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70'}`}>Новые</button>
                            <button onClick={() => setSortDate('oldest')} className={`px-3 py-1.5 rounded-lg text-sm ${sortDate === 'oldest' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70'}`}>Старые</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setSortCorrectness('all')} className={`px-3 py-1.5 rounded-lg text-sm ${sortCorrectness === 'all' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70'}`}>Все</button>
                            <button onClick={() => setSortCorrectness('correct-first')} className={`px-3 py-1.5 rounded-lg text-sm ${sortCorrectness === 'correct-first' ? 'bg-green-500 text-white' : 'bg-secondary/10 text-text/70'}`}>Верные</button>
                            <button onClick={() => setSortCorrectness('incorrect-first')} className={`px-3 py-1.5 rounded-lg text-sm ${sortCorrectness === 'incorrect-first' ? 'bg-red-500 text-white' : 'bg-secondary/10 text-text/70'}`}>Ошибки</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setSortDifficulty('default')} className={`px-3 py-1.5 rounded-lg text-sm ${sortDifficulty === 'default' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70'}`}>Любая</button>
                            <button onClick={() => setSortDifficulty('easy-first')} className={`px-3 py-1.5 rounded-lg text-sm ${sortDifficulty === 'easy-first' ? 'bg-green-500/20 text-green-400' : 'bg-secondary/10 text-text/70'}`}>Лёгкие</button>
                            <button onClick={() => setSortDifficulty('hard-first')} className={`px-3 py-1.5 rounded-lg text-sm ${sortDifficulty === 'hard-first' ? 'bg-red-500/20 text-red-400' : 'bg-secondary/10 text-text/70'}`}>Сложные</button>
                        </div>
                    </div>
                </div>

                <div className="bg-background border border-secondary/20 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="bg-secondary/10 border-b border-secondary/20">
                                <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase">Задание</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase">Тип</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase hidden lg:table-cell">Ответы</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase">Результат</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-text/70 uppercase hidden md:table-cell">Дата</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/10">
                            {filteredAndSortedStats.map((solution) => {
                                const diffConfig = getDifficultyConfig(solution.exerciseDifficulty);
                                return (
                                    <tr key={solution.solutionId} className="hover:bg-secondary/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-text">{solution.exerciseTitle}</span>
                                                <span className={`w-max px-2 py-0.5 text-xs font-medium rounded-full border ${diffConfig.color}`}>
                                                    {diffConfig.label}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            {solution.isExam ? (
                                                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">Контрольная</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">Тренировка</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 hidden lg:table-cell space-y-2">
                                            <div>
                                                <span className="text-xs text-text/50 block mb-1">Ваш ответ:</span>
                                                <code className={`px-2 py-1 rounded text-xs font-mono block w-max ${solution.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {solution.userAnswer.length > 30 ? solution.userAnswer.substring(0, 30) + "..." : solution.userAnswer}
                                                </code>
                                            </div>
                                            {solvedExerciseIds.has(solution.exerciseId) && (
                                                <div>
                                                    <span className="text-xs text-text/50 block mb-1">Верный:</span>
                                                    <code className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-mono block w-max">
                                                        {solution.correctAnswer.length > 30 ? solution.correctAnswer.substring(0, 30) + "..." : solution.correctAnswer}
                                                    </code>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            {solution.isCorrect ? (
                                                <span className="inline-flex px-2.5 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">Верно</span>
                                            ) : (
                                                <span className="inline-flex px-2.5 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">Ошибка</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell text-text/50 text-sm">
                                            {new Date(solution.submittedAt).toLocaleDateString('ru-RU')}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {filteredAndSortedStats.length === 0 && (
                        <div className="text-center py-16 text-text/50">
                            Ничего не найдено по вашему запросу
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}