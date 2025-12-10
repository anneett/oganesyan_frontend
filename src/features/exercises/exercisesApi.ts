import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// export enum ExerciseDifficulty {
//     Easy,
//     Medium,
//     Hard,
// }

export interface Exercise {
    id: number;
    title: string;
//  difficulty: ExerciseDifficulty;
    difficulty: 0 | 1 | 2;
    correctAnswer: string;
}

export interface CreateExerciseRequest {
    title: string;
    difficulty: number;
    correctAnswer: string;
}

export const exercisesApi = createApi({
    reducerPath: "exercisesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:5177/api',
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        }
    }),
    endpoints: (builder) => ({
        createExercise: builder.mutation<Exercise, CreateExerciseRequest>({
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