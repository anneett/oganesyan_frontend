import { useGetExercisesQuery } from "./exercisesApi.ts";
import { Link } from "react-router-dom";

export function ExercisesPage() {
    const { data: exercises, isLoading, error } = useGetExercisesQuery();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Ошибка загрузки</div>;

    return (
        <div>
            <h1>Список упражнений</h1>
            <ul>
                {exercises?.map((exercise) => (
                    <li key={exercise.id}>{exercise.title} ({exercise.difficulty})</li>
                ))}
            </ul>
            <p>
                <Link to="/profile">Профиль</Link>
            </p>
        </div>
    );
}