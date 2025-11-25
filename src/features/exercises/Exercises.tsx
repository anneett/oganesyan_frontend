import { useGetExercisesQuery } from './exercisesApi'

export function Exercises() {
    const { data: exercises, isLoading, error } = useGetExercisesQuery();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {(error as any).message}</div>;

    return (
        <ul>
            {exercises?.map(exercise => (
                <li key={exercise.id}>
                    {exercise.title} ({exercise.difficulty})
                </li>
            ))}
        </ul>
    )
}