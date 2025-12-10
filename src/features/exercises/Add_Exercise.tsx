import { useState } from "react";
import { Link } from "react-router-dom";
import * as React from "react";
import { useCreateExerciseMutation } from "./exercisesApi.ts";

export const Add_Exercise = () => {
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState(-1);
    const [correctAnswer, setCorrectAnswer] = useState("");

    const [createExercise, { error, isLoading }] = useCreateExerciseMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createExercise({
                title,
                difficulty,
                correctAnswer,
            }).unwrap();
        }
        catch (error) {
            console.error("Ошибка добавления задания:", error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="text-gradient">Добавить задание</h2>
                <h3>Введите поля для создания нового задания</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Название задания"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Сложность задания"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Правильный ответ"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                    />

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Добавление задания..." : "Добавить задание"}
                    </button>
                </form>

                {error && <p className="error">Ошибка добавления задания. Попробуйте ещё раз.</p>}

            </div>
        </div>
    );
}