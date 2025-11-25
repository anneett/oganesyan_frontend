import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// export enum ExerciseDifficulty {
//     Easy,
//     Medium,
//     Hard,
// }

export interface Exercise {
    id: number;
    title: string;
//     difficulty: ExerciseDifficulty;
    difficulty: 0 | 1 | 2;
    correctAnswer: string;
}

export interface QueryResult {
    result: string;
}

export const exercisesApi = createApi({
    reducerPath: "exercisesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:5177/api',
    }),
    endpoints: (builder) => ({
        createExercise: builder.mutation<Exercise, Partial<Exercise>>({
            query: (newExercise) => ({
                url: '/Exercises/add',
                method: 'POST',
                body: newExercise,
            }),
        }),
        getExerciseById: builder.query<Exercise, number>({
            query: (id) => `/Exercises/${id}`,
        }),
        getExercises: builder.query<Exercise[], void>({
            query: () => '/Exercises/all',
        }),
    }),
});

export const {
    useGetExercisesQuery,
    useGetExerciseByIdQuery,
    useCreateExerciseMutation,
} = exercisesApi;