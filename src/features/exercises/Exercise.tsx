import { useGetExerciseByIdQuery } from "./exercisesApi.ts";
import { useCreateSolutionMutation } from "../solutions/solutionsApi.ts";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import * as React from "react";

export function Exercise() {
    const { id } = useParams();
    const { data: exercise, isLoading, error } = useGetExerciseByIdQuery(Number(id));

    const [createSolution, { data: solution }] = useCreateSolutionMutation();
    const [answer, setAnswer] = useState("");

    if (isLoading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка загрузки</div>;
    if (!exercise) return <div>Задача не найдена</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createSolution({
                exerciseId: exercise.id,
                userAnswer: answer,
            }).unwrap();
        }
        catch (error) {
            console.error("Ошибка отправки решения:", error);
        }
    };

    return (
        <div className="exercise-page">
            <main className="exercise-card">
                <Link to="/exercises" className="back-link">Вернуться к заданиям</Link>
                <p>Условие задачи</p>
                <p>{ exercise.title }</p>

                <p className="exercise-text">
                    <b>Сложность:</b> {["Легкая", "Средняя", "Тяжелая"][exercise.difficulty]}
                </p>

                <p>Ваш ответ</p>
                <form onSubmit={handleSubmit} className="answer-form">
                    <input
                        type="text"
                        placeholder="Введите ответ..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    />
                    <button type="submit">Отправить</button>
                </form>
                {solution && (
                    <div className="result-box">
                        <p><b>Ваш ответ: </b>{solution.userAnswer}</p>
                        <p><b>Результат: </b>{solution.isCorrect ? "Верно 🎉" : "Неверно ❌"}</p>
                        <p><b>Комментарий:</b> {solution.result}</p>
                    </div>
                )}
        </main>
    </div>
    );
}