import { useMemo, useState } from "react";
import {Link, useParams} from "react-router-dom";
import { useGetDatabaseMetasQuery } from "../databaseMetas/databaseMetasApi";
import { useGetUserProfileByIdQuery, useGetUserStatsQuery } from "./usersApi";

type SortDate = 'newest' | 'oldest';
type SortCorrectness = 'all' | 'correct-first' | 'incorrect-first';
type SortDifficulty = 'default' | 'easy-first' | 'hard-first';
type FilterType = 'all' | 'exam' | 'training';

export function UserProfileView() {
    const { id } = useParams();
    const userId = Number(id);

    const [searchTitle, setSearchTitle] = useState("");
    const [selectedDbId, setSelectedDbId] = useState<number | null>(null);

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [sortDate, setSortDate] = useState<SortDate>('newest');
    const [sortCorrectness, setSortCorrectness] = useState<SortCorrectness>('all');
    const [sortDifficulty, setSortDifficulty] = useState<SortDifficulty>('default');
    const [filterType, setFilterType] = useState<FilterType>('all');

    const { data: user, isLoading: loadingUser } = useGetUserProfileByIdQuery(userId);
    const { data: databases = [] } = useGetDatabaseMetasQuery();
    const { data: stats = [], isLoading: loadingStats } = useGetUserStatsQuery({
        userId,
        ...(selectedDbId ? { databaseMetaId: selectedDbId } : {}),
    });

    const totalSolutions = stats.length;
    const correctSolutions = stats.filter((item) => item.isCorrect).length;
    const successRate = totalSolutions > 0 ? Math.round((correctSolutions / totalSolutions) * 100) : 0;
    const solvedExercises = useMemo(() => new Set(stats.filter((item) => item.isCorrect).map((item) => item.exerciseId)), [stats]);
    const getDifficultyConfig = (difficulty: number) => {
        const configs = [
            { label: "Легкий", color: "bg-green-500/20 text-green-400 border-green-500/30" },
            { label: "Средний", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            { label: "Сложный", color: "bg-red-500/20 text-red-400 border-red-500/30" }
        ];

        return configs[difficulty - 1] || configs[0];
    };

    const filteredAndSortedStats = useMemo(() => {
        let result = [...stats];

        if (searchTitle) {
            result = result.filter(s => s.exerciseTitle.toLowerCase().includes(searchTitle.toLowerCase()));
        }

        if (filterType === 'exam') result = result.filter(s => s.isExam);
        else if (filterType === 'training') result = result.filter(s => !s.isExam);

        return result.sort((a, b) => {
            if (sortCorrectness === 'correct-first') return (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0);
            if (sortCorrectness === 'incorrect-first') return (a.isCorrect ? 1 : 0) - (b.isCorrect ? 1 : 0);
            if (sortDifficulty === 'easy-first') return a.exerciseDifficulty - b.exerciseDifficulty;
            if (sortDifficulty === 'hard-first') return b.exerciseDifficulty - a.exerciseDifficulty;
            if (sortDate === 'newest') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        });
    }, [stats, searchTitle, sortDate, sortCorrectness, sortDifficulty, filterType]);

    if (loadingUser || loadingStats) return <div className="mx-auto max-w-6xl px-4 py-8 text-text/60">Загружаем профиль студента...</div>;
    if (!user) return <div className="mx-auto max-w-6xl px-4 py-8 text-red-300">Студент не найден.</div>;

    const hasActiveFilters = sortDate !== 'newest' || sortCorrectness !== 'all' || sortDifficulty !== 'default' || filterType !== 'all';

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <section className="mb-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.16),rgba(70,175,171,0.1),rgba(64,110,132,0.16))] p-6 shadow-2xl shadow-black/20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-text/40">Student Profile</p>
                        <h1 className="mt-3 text-3xl font-semibold text-text">{user.userName}</h1>
                        <p className="mt-2 text-text/60">@{user.login}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Попыток</p>
                            <p className="mt-2 text-2xl font-semibold text-primary">{totalSolutions}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Решено задач</p>
                            <p className="mt-2 text-2xl font-semibold text-secondary">{solvedExercises.size}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Успешность</p>
                            <p className="mt-2 text-2xl font-semibold text-accent">{successRate}%</p>
                        </div>
                    </div>
                </div>
            </section>

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
                <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={`px-4 py-3 rounded-xl border transition-all ${isFiltersOpen || hasActiveFilters ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-background border-secondary/30 text-text/70'}`}
                >
                    Сортировка и фильтры {hasActiveFilters && " (Активны)"}
                </button>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${isFiltersOpen ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 space-y-5">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-text/40 mb-3">
                            Сортировка
                        </p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-text/40 mb-2">По дате</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSortDate('newest')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDate === 'newest' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Новые</button>
                                    <button onClick={() => setSortDate('oldest')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDate === 'oldest' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Старые</button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-text/40 mb-2">По правильности</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSortCorrectness('all')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortCorrectness === 'all' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Все</button>
                                    <button onClick={() => setSortCorrectness('correct-first')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortCorrectness === 'correct-first' ? 'bg-green-500 text-white' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Верные</button>
                                    <button onClick={() => setSortCorrectness('incorrect-first')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortCorrectness === 'incorrect-first' ? 'bg-red-500 text-white' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Ошибки</button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-text/40 mb-2">По сложности</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setSortDifficulty('default')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDifficulty === 'default' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Без сортировки</button>
                                    <button onClick={() => setSortDifficulty('easy-first')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDifficulty === 'easy-first' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Сначала легкие</button>
                                    <button onClick={() => setSortDifficulty('hard-first')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sortDifficulty === 'hard-first' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Сначала сложные</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-secondary/20">
                        <p className="text-xs uppercase tracking-[0.2em] text-text/40 mb-3">
                            Фильтры
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterType === 'all' ? 'bg-accent text-background' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Все типы</button>
                            <button onClick={() => setFilterType('training')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterType === 'training' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Тренировки</button>
                            <button onClick={() => setFilterType('exam')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filterType === 'exam' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-secondary/10 text-text/70 hover:bg-secondary/20'}`}>Контрольные</button>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="pt-4 border-t border-secondary/20">
                            <button
                                onClick={() => {
                                    setSortDate('newest');
                                    setSortCorrectness('all');
                                    setSortDifficulty('default');
                                    setFilterType('all');
                                }}
                                className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
                            >
                                Сбросить фильтры и сортировки
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <section className="space-y-4">
                {filteredAndSortedStats.map((solution) => {
                    const diffConfig = getDifficultyConfig(solution.exerciseDifficulty);
                    const databaseName =
                        databases.find(db => db.id === solution.databaseMetaId)?.logicalName ?? "База данных";

                    return (
                    <article key={solution.solutionId} className="rounded-2xl border border-secondary/20 bg-secondary/5 p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="inline-flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] px-2 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-medium">
                                            {databaseName}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${diffConfig.color}`}>
                                            {diffConfig.label}
                                        </span>
                                    </div>
                                    <Link to={`/exercise/${solution.exerciseId}`} className="text-xl font-semibold text-text hover:text-accent transition-colors">
                                        {solution.exerciseTitle || "Без названия"}
                                    </Link>
                                    {solution.isExam ? (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">Контрольная</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium">Тренировка</span>
                                    )}
                                </div>
                                <p className="text-sm text-text/55">{new Date(solution.submittedAt).toLocaleString("ru-RU")}</p>
                            </div>

                            <span className={`rounded-full px-3 py-1 text-sm font-medium ${solution.isCorrect ? "border border-green-500/20 bg-green-500/10 text-green-300" : "border border-red-500/20 bg-red-500/10 text-red-300"}`}>
                                {solution.isCorrect ? "Верно" : "Ошибка"}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-[#0f1720] p-4">
                                <p className="mb-2 text-sm font-medium text-text/70">Ответ студента</p>
                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">{solution.userAnswer}</pre>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-[#0f1720] p-4">
                                <p className="mb-2 text-sm font-medium text-text/70">Правильный ответ</p>
                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">{solution.correctAnswer}</pre>
                            </div>
                        </div>
                    </article>
                    );
                })}

                {filteredAndSortedStats.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-secondary/20 bg-secondary/5 p-10 text-center text-text/50">
                        По выбранному фильтру решений пока нет.
                    </div>
                )}
            </section>
        </div>
    );
}