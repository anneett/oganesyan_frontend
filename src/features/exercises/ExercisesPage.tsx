import {useGetExercisesQuery } from "./exercisesApi.ts";

export function ExercisesPage() {
    const { data: exercises, isLoading } = useGetExercisesQuery();

    if (isLoading) return <div>Loading...</div>;

    return (
        <ul>
            {exercises?.map((exercise) => (
                <li key={exercise.id}>{exercise.title} ({exercise.difficulty})</li>
            ))}
        </ul>
    );
}