import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetAttemptDetailsQuery, useGetAttemptExercisesQuery, useGetUserAttemptsQuery } from "./examsApi";
import { useGetExercisesQuery } from "../exercises/exercisesApi";

const difficultyLabels = ["Легкая", "Средняя", "Сложная"];

type AttemptSolution = {
    exerciseId: number;
    exerciseTitle: string;
    userAnswer: string;
    isCorrect: boolean;
    result: string | null;
};

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

export const ExamResults = () => {
    const { examId } = useParams();
    const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

    const { data: attemptsData, isLoading: isLoadingAttempts } = useGetUserAttemptsQuery(
        examId ? Number(examId) : skipToken,
    );

    const { data: exercises = [] } = useGetExercisesQuery();

    const { data: attemptDetails } = useGetAttemptDetailsQuery(selectedAttemptId ?? skipToken, {
        skip: !selectedAttemptId,
    });

    const { data: attemptExercises = [] } = useGetAttemptExercisesQuery(selectedAttemptId ?? 0, {
        skip: !selectedAttemptId,
    });

    const solutionMap = useMemo(() => {
        const map = new Map<number, AttemptSolution>();
        attemptDetails?.solutions?.forEach((solution) => {
            map.set(solution.exerciseId, solution);
        });
        return map;
    }, [attemptDetails?.solutions]);

    const selectedAttemptSummary = attemptsData?.attempts.find((attempt) => attempt.attemptId === selectedAttemptId) ?? null;
    const selectedAttemptTotalExercises = attemptExercises.length || attemptDetails?.totalExercises || 0;
    const selectedAttemptSolved = attemptDetails?.solutions?.length ?? 0;
    const selectedAttemptCorrect = attemptDetails?.correctAnswers ?? 0;
    const selectedAttemptUnsolved = Math.max(selectedAttemptTotalExercises - selectedAttemptSolved, 0);
    const isResultsReleased = Boolean(attemptsData?.isResultsReleased);

    if (isLoadingAttempts) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <p className="text-text/60">Загрузка попыток...</p>
                </div>
            </div>
        );
    }

    if (!attemptsData) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="rounded-[2rem] border border-red-500/25 bg-red-500/10 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-red-200">Контрольная не найдена</h1>
                    <Link
                        to="/exam"
                        className="mt-6 inline-flex rounded-2xl bg-red-500/15 px-4 py-2 font-medium text-red-100 transition hover:bg-red-500/20"
                    >
                        Вернуться к списку
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(48,102,124,0.18),rgba(70,175,171,0.12),rgba(212,179,104,0.14))] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-text/40">Результаты контрольной</p>
                        <h1 className="text-3xl font-semibold text-text sm:text-4xl">{attemptsData.examTitle}</h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-text/65">
                            {isResultsReleased
                                ? "Результаты опубликованы. Можно открыть любую попытку и посмотреть подробности по каждому заданию."
                                : "Пока идет проверка преподавателем. Список ваших завершенных попыток уже доступен, но оценки и сравнение результатов пока скрыты."}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                            <p className="text-sm text-text/50">Попыток использовано</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">
                                {attemptsData.usedAttempts}
                                {attemptsData.maxAttempts !== null && ` / ${attemptsData.maxAttempts}`}
                            </p>
                        </div>
                        {isResultsReleased && attemptsData.bestAttemptId && (
                            <div className="rounded-3xl border border-white/8 bg-black/18 p-5">
                                <p className="text-sm text-text/50">Лучший результат</p>
                                <p className="mt-2 text-3xl font-semibold text-accent">
                                    {attemptsData.attempts.find((attempt) => attempt.attemptId === attemptsData.bestAttemptId)?.percentage ?? 0}
                                    %
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {attemptsData.attempts.length === 0 ? (
                <div className="rounded-[2rem] border border-white/8 bg-white/4 p-8 text-center">
                    <p className="text-lg text-text/60">
                        {attemptsData.message ?? "У вас пока нет завершенных попыток этой контрольной."}
                    </p>
                    <Link
                        to="/exam"
                        className="mt-6 inline-flex rounded-2xl bg-accent/15 px-5 py-3 font-medium text-accent transition hover:bg-accent/20"
                    >
                        Вернуться к контрольным
                    </Link>
                </div>
            ) : (
                <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-text">Ваши попытки</h2>
                            <p className="mt-1 text-sm text-text/55">
                                {isResultsReleased
                                    ? "Выберите попытку для просмотра деталей"
                                    : "Результаты пока скрыты, но вы можете увидеть список своих завершенных попыток."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {attemptsData.attempts.map((attempt, index) => {
                                const isSelected = attempt.attemptId === selectedAttemptId;
                                const isBest = isResultsReleased && attempt.attemptId === attemptsData.bestAttemptId;

                                return (
                                    <button
                                        key={attempt.attemptId}
                                        type="button"
                                        onClick={() => setSelectedAttemptId(attempt.attemptId)}
                                        className={`w-full rounded-3xl border p-5 text-left transition ${
                                            isSelected
                                                ? "border-accent/40 bg-accent/10"
                                                : "border-white/8 bg-black/15 hover:border-white/12 hover:bg-black/20"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                                            isSelected
                                                                ? "border-accent/30 bg-accent/20 text-accent"
                                                                : "border-white/10 bg-black/20 text-text/55"
                                                        }`}
                                                    >
                                                        Попытка {attemptsData.attempts.length - index}
                                                    </span>
                                                    {isBest && (
                                                        <span className="rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-medium text-green-300">
                                                            Лучшая
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-3 text-sm text-text/55">Начата: {formatDateTime(attempt.startedAt)}</p>
                                                {attempt.finishedAt && (
                                                    <p className="text-sm text-text/55">Завершена: {formatDateTime(attempt.finishedAt)}</p>
                                                )}
                                            </div>

                                            {isResultsReleased && (
                                                <div className="rounded-2xl border border-white/10 bg-[#0f1720] px-4 py-3 text-center">
                                                    <p className="text-xs text-text/50">Результат</p>
                                                    <p className="mt-1 text-2xl font-semibold text-text">{attempt.percentage}%</p>
                                                    <p className="mt-1 text-xs text-text/45">
                                                        {attempt.correctAnswers} / {attempt.totalAnswers}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <Link
                            to="/exam"
                            className="mt-6 block w-full rounded-2xl border border-white/10 bg-black/15 px-5 py-3 text-center font-medium text-text transition hover:bg-black/20"
                        >
                            Вернуться к контрольным
                        </Link>
                    </div>

                    <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-xl shadow-black/15">
                        {!selectedAttemptId ? (
                            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-20 text-center">
                                <p className="text-text/50">
                                    {isResultsReleased
                                        ? "Выберите попытку слева, чтобы посмотреть решения и статистику."
                                        : "Выберите попытку слева. Пока идет проверка, здесь будет только статус публикации результатов."}
                                </p>
                            </div>
                        ) : !attemptDetails ? (
                            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-5 py-20 text-center">
                                <p className="text-text/50">Загружаем детали попытки...</p>
                            </div>
                        ) : !attemptDetails.isResultsReleased ? (
                            <div className="rounded-3xl border border-yellow-500/25 bg-yellow-500/10 p-8 text-center">
                                <h3 className="text-xl font-semibold text-yellow-200">Результаты еще не опубликованы</h3>
                                <p className="mt-3 text-yellow-100/80">
                                    {attemptDetails.message ?? "После проверки здесь появятся правильные и неверные ответы."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-green-500/25 bg-green-500/10 p-6">
                                    <h3 className="text-2xl font-semibold text-green-200">Итоги попытки</h3>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <p className="text-sm text-green-100/70">Правильных ответов</p>
                                            <p className="mt-1 text-3xl font-semibold text-green-100">
                                                {selectedAttemptCorrect} / {selectedAttemptTotalExercises}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-100/70">Решено заданий</p>
                                            <p className="mt-1 text-3xl font-semibold text-green-100">{selectedAttemptSolved}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-100/70">Нерешено заданий</p>
                                            <p className="mt-1 text-3xl font-semibold text-green-100">{selectedAttemptUnsolved}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-100/70">Процент</p>
                                            <p className="mt-1 text-3xl font-semibold text-green-100">
                                                {selectedAttemptTotalExercises
                                                    ? Math.round((selectedAttemptCorrect / selectedAttemptTotalExercises) * 100)
                                                    : 0}
                                                %
                                            </p>
                                        </div>
                                    </div>

                                    {selectedAttemptSummary && (
                                        <p className="mt-4 text-sm text-green-100/80">
                                            Попытка начата {formatDateTime(selectedAttemptSummary.startedAt)}
                                            {selectedAttemptSummary.finishedAt ? ` и завершена ${formatDateTime(selectedAttemptSummary.finishedAt)}.` : "."}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {attemptExercises.map((exercise, index) => {
                                        const solution = solutionMap.get(exercise.id);
                                        const fullExercise = exercises.find((item) => item.id === exercise.id);

                                        return (
                                            <article
                                                key={exercise.id}
                                                className="rounded-3xl border border-white/8 bg-black/15 p-5"
                                            >
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                                Задание {index + 1}
                                                            </span>
                                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text/55">
                                                                {difficultyLabels[exercise.difficulty] ?? difficultyLabels[0]}
                                                            </span>
                                                        </div>
                                                        <h4 className="mt-3 text-lg font-semibold text-text">{exercise.title}</h4>
                                                    </div>

                                                    <div
                                                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                                                            !solution
                                                                ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                                : solution.isCorrect
                                                                    ? "border border-green-500/20 bg-green-500/10 text-green-300"
                                                                    : "border border-red-500/20 bg-red-500/10 text-red-300"
                                                        }`}
                                                    >
                                                        {!solution ? "Нет ответа" : solution.isCorrect ? "Верно" : "Ошибка"}
                                                    </div>
                                                </div>

                                                {solution ? (
                                                    <>
                                                        <div className="mt-4 rounded-2xl border border-white/8 bg-[#0f1720] px-4 py-3">
                                                            <p className="mb-2 text-sm font-medium text-text/70">Ваш ответ:</p>
                                                            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">
                                                                {solution.userAnswer}
                                                            </pre>
                                                        </div>

                                                        {solution.result && (
                                                            <div
                                                                className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                                                                    solution.isCorrect
                                                                        ? "border-green-500/25 bg-green-500/10 text-green-300"
                                                                        : "border-red-500/25 bg-red-500/10 text-red-300"
                                                                }`}
                                                            >
                                                                {solution.result}
                                                            </div>
                                                        )}

                                                        {!solution.isCorrect && fullExercise?.correctAnswer && (
                                                            <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                                                <p className="mb-2 text-sm font-medium text-text/70">Правильный ответ:</p>
                                                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-text">
                                                                    {fullExercise.correctAnswer}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-text/55">
                                                        Для этого задания в выбранной попытке ответ не был отправлен.
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};
