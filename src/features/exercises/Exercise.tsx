import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { API_ORIGIN } from "../../app/baseQuery";
import { getApiErrorMessage } from "../../app/getApiErrorMessage";
import { useGetDatabaseMetaByIdQuery } from "../databaseMetas/databaseMetasApi";
import { useCreateSolutionMutation } from "../solutions/solutionsApi";
import { useGetExerciseByIdQuery, useGetExerciseStatsQuery, useGetExercisesQuery } from "./exercisesApi";

const difficultyConfig = [
    { label: "Легкая", className: "border-green-500/25 bg-green-500/10 text-green-300" },
    { label: "Средняя", className: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300" },
    { label: "Сложная", className: "border-red-500/25 bg-red-500/10 text-red-300" },
];

const getAssetUrl = (path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return path.startsWith("/") ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`;
};

export function Exercise() {
    const { id } = useParams();
    const exerciseId = Number(id);

    const [deploymentId, setDeploymentId] = useState<number>(0);
    const [answer, setAnswer] = useState("");
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { data: exercise, isLoading: loadingExercise, error: exerciseError } = useGetExerciseByIdQuery(exerciseId);
    const { data: allExercises = [] } = useGetExercisesQuery();
    const { data: stats } = useGetExerciseStatsQuery(exerciseId);
    const { data: databaseMeta } = useGetDatabaseMetaByIdQuery(exercise?.databaseMetaId ?? skipToken);
    const [createSolution, { data: solution, isLoading: isSubmitting }] = useCreateSolutionMutation();

    const deployments = useMemo(
        () => (databaseMeta?.deployments ?? []).filter((deployment) => deployment.isDeployed),
        [databaseMeta],
    );
    const effectiveDeploymentId = deploymentId || deployments[0]?.id || 0;

    const currentExerciseIndex = useMemo(
        () => allExercises.findIndex((item) => item.id === exerciseId),
        [allExercises, exerciseId],
    );

    const previousExercise = currentExerciseIndex > 0 ? allExercises[currentExerciseIndex - 1] : null;
    const nextExercise =
        currentExerciseIndex >= 0 && currentExerciseIndex < allExercises.length - 1
            ? allExercises[currentExerciseIndex + 1]
            : null;

    const erdImageUrl = getAssetUrl(databaseMeta?.erdImagePath);

    if (loadingExercise) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4 py-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <p className="text-text/60">Загружаем задание...</p>
                </div>
            </div>
        );
    }

    if (exerciseError || !exercise) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <div className="rounded-[2rem] border border-red-500/25 bg-red-500/10 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-red-200">Задание не найдено</h1>
                    <p className="mt-3 text-red-100/80">Не удалось загрузить данные упражнения.</p>
                    <Link
                        to="/exercises"
                        className="mt-6 inline-flex rounded-2xl bg-red-500/15 px-4 py-2 font-medium text-red-100 transition hover:bg-red-500/20"
                    >
                        Вернуться к списку
                    </Link>
                </div>
            </div>
        );
    }

    const difficulty = difficultyConfig[exercise.difficulty] ?? difficultyConfig[0];

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!effectiveDeploymentId) {
            setSubmitError("Сначала выберите развертывание, на котором нужно проверить запрос.");
            return;
        }

        try {
            setSubmitError(null);
            setShowCorrectAnswer(false);

            await createSolution({
                exerciseId: exercise.id,
                deploymentId: effectiveDeploymentId,
                userAnswer: answer,
            }).unwrap();
        } catch (requestError) {
            setSubmitError(getApiErrorMessage(requestError, "Не удалось проверить решение."));
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(212,179,104,0.14),rgba(48,102,124,0.12),rgba(70,175,171,0.1))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-text/55">
                                Задание #{exercise.id}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-sm ${difficulty.className}`}>
                                {difficulty.label}
                            </span>
                            {databaseMeta && (
                                <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-sm text-secondary">
                                    {databaseMeta.logicalName}
                                </span>
                            )}
                        </div>

                        <h1 className="mt-4 text-3xl font-semibold text-text">{exercise.title}</h1>

                        <p className="mt-4 max-w-2xl text-base leading-7 text-text/65">
                            Напишите SQL-запрос и проверьте его на одном из доступных развертываний выбранной логической БД.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                to="/exercises"
                                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                            >
                                К списку заданий
                            </Link>
                            {previousExercise && (
                                <Link
                                    to={`/exercise/${previousExercise.id}`}
                                    className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                >
                                    Предыдущее
                                </Link>
                            )}
                            {nextExercise && (
                                <Link
                                    to={`/exercise/${nextExercise.id}`}
                                    className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/15"
                                >
                                    Следующее
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Попыток</p>
                            <p className="mt-2 text-2xl font-semibold text-text">{stats?.totalAttempts ?? 0}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Успешность</p>
                            <p className="mt-2 text-2xl font-semibold text-accent">{stats ? `${Math.round(stats.percentCorrect)}%` : "0%"}</p>
                        </div>
                        <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                            <p className="text-sm text-text/50">Участников</p>
                            <p className="mt-2 text-2xl font-semibold text-secondary">{stats?.uniqueUsers ?? 0}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr,0.92fr]">
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-5">
                            <h2 className="text-2xl font-semibold text-text">Проверка решения</h2>
                            <p className="mt-1 text-sm text-text/55">Выберите нужное развертывание, чтобы бэкенд проверил ответ на реальной базе.</p>
                        </div>

                        <div className="mb-5">
                            <label className="mb-2 block text-sm font-medium text-text/70">Развертывание</label>
                            {deployments.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                    Для этой логической БД пока нет доступных развертываний. Обратитесь к администратору.
                                </div>
                            ) : (
                                <select
                                    value={effectiveDeploymentId}
                                    onChange={(event) => setDeploymentId(Number(event.target.value))}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-text outline-none transition focus:border-accent/50"
                                >
                                    {deployments.map((deployment) => (
                                        <option key={deployment.id} value={deployment.id}>
                                            {deployment.dbMeta?.dbType} · {deployment.physicaDatabaseName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label className="mb-2 block text-sm font-medium text-text/70">Ваш SQL-ответ</label>
                            <textarea
                                rows={9}
                                value={answer}
                                onChange={(event) => setAnswer(event.target.value)}
                                placeholder="SELECT ..."
                                className="w-full rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 font-mono text-sm text-text outline-none transition focus:border-accent/50"
                            />

                            {submitError && (
                                <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                    {submitError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !answer.trim() || deployments.length === 0}
                                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 font-semibold text-background transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {isSubmitting ? "Проверяем ответ..." : "Отправить решение"}
                            </button>
                        </form>
                    </div>

                    {solution && (
                        <div
                            className={`rounded-[2rem] border p-6 shadow-xl ${
                                solution.isCorrect
                                    ? "border-green-500/25 bg-green-500/10 shadow-green-950/10"
                                    : "border-red-500/25 bg-red-500/10 shadow-red-950/10"
                            }`}
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className={`text-2xl font-semibold ${solution.isCorrect ? "text-green-200" : "text-red-200"}`}>
                                        {solution.isCorrect ? "Ответ верный" : "Ответ не совпал"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-text/70">{solution.result}</p>
                                </div>

                                {!solution.isCorrect && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCorrectAnswer((prev) => !prev)}
                                        className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                                    >
                                        {showCorrectAnswer ? "Скрыть ответ" : "Показать эталон"}
                                    </button>
                                )}
                            </div>

                            {showCorrectAnswer && !solution.isCorrect && (
                                <div className="mt-5 rounded-2xl border border-white/8 bg-black/15 px-4 py-4">
                                    <p className="mb-2 text-sm font-medium text-text/70">Эталонный SQL</p>
                                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">{exercise.correctAnswer}</pre>
                                </div>
                            )}

                            {solution.isCorrect && nextExercise && (
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Link
                                        to={`/exercise/${nextExercise.id}`}
                                        className="rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-background transition hover:opacity-95"
                                    >
                                        Перейти к следующему заданию
                                    </Link>
                                    <Link
                                        to="/exercises"
                                        className="rounded-2xl border border-white/10 bg-black/15 px-5 py-3 text-sm font-medium text-text transition hover:bg-black/20"
                                    >
                                        Вернуться к списку
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <aside className="space-y-6">
                    {databaseMeta && (
                        <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-semibold text-text">Схема БД</h2>
                                    <p className="mt-1 text-sm text-text/55">{databaseMeta.logicalName}</p>
                                </div>
                            </div>

                            {erdImageUrl ? (
                                <a href={erdImageUrl} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-3xl border border-white/10 bg-black/15">
                                    <img src={erdImageUrl} alt={`ERD ${databaseMeta.logicalName}`} className="max-h-[420px] w-full object-contain bg-[#0f1720]" />
                                </a>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-sm text-text/55">
                                    Для этой базы пока не загружена ERD-диаграмма.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-text">Статистика</h2>
                                <p className="mt-1 text-sm text-text/55">Короткая сводка по решению этого упражнения.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowStats((prev) => !prev)}
                                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm font-medium text-text transition hover:bg-black/20"
                            >
                                {showStats ? "Скрыть" : "Показать"}
                            </button>
                        </div>

                        {showStats && (
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Всего попыток</p>
                                    <p className="mt-2 text-2xl font-semibold text-text">{stats?.totalAttempts ?? 0}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Верных ответов</p>
                                    <p className="mt-2 text-2xl font-semibold text-green-300">{stats?.correctAnswers ?? 0}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Участников</p>
                                    <p className="mt-2 text-2xl font-semibold text-secondary">{stats?.uniqueUsers ?? 0}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                                    <p className="text-sm text-text/50">Процент успеха</p>
                                    <p className="mt-2 text-2xl font-semibold text-accent">
                                        {stats ? `${stats.percentCorrect.toFixed(1)}%` : "0%"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </section>
        </div>
    );
}
