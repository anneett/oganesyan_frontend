import { useGetExercisesQuery } from "./exercisesApi.ts";
import { Link } from "react-router-dom";
import "./Exercises.css";

export function Exercises() {
    const { data: exercises, isLoading, error } = useGetExercisesQuery();


    if (isLoading) return <div>Загрузка...</div>;
    if (error) return <div>Ошибка загрузки</div>;

    return (
        <div className="page">
            <main className="content">

                <Link to="/profile" className="header-link">Профиль</Link>
                <Link to="/users" className="header-link">Пользователи</Link>
                <button className="logout-btn">Выйти</button>
                <h1>Список упражнений</h1>

                <table className="exercise-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Сложность</th>
                    </tr>
                    </thead>
                    <tbody>
                    {exercises?.map((exercise) => (
                        <tr key={exercise.id}>
                            <td>{exercise.id}</td>
                            <td>
                                <Link to={`/exercise/${exercise.id}`}>
                                    {exercise.title}
                                </Link>
                            </td>
                            <td>{["Легкая", "Средняя", "Тяжелая"][exercise.difficulty]}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
}