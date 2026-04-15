import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../app/baseQuery";

export interface Exercise {
    id: number;
    title: string;
    difficulty: 0 | 1 | 2;
    databaseMetaId: number;
    correctAnswer: string;
}

export interface CreateExerciseRequest {
    title: string;
    difficulty: 0 | 1 | 2;
    databaseMetaId: number;
    correctAnswer: string;
}

export interface ExerciseStatsDto {
    exerciseId: number;
    exerciseTitle: string;
    totalAttempts: number;
    uniqueUsers: number;
    correctAnswers: number;
    percentCorrect: number;
}

export const exercisesApi = createApi({
    reducerPath: "exercisesApi",
    baseQuery,
    tagTypes: ["Exercises"],
    endpoints: (builder) => ({
        createExercise: builder.mutation<Exercise, CreateExerciseRequest>({
            query: (payload) => ({
                url: "/Exercises/add",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Exercises"],
        }),
        getExerciseById: builder.query<Exercise, number>({
            query: (id) => `/Exercises/${id}`,
        }),
        getExercises: builder.query<Exercise[], void>({
            query: () => "/Exercises/all",
            providesTags: ["Exercises"],
        }),
        getExerciseStats: builder.query<ExerciseStatsDto, number>({
            query: (id) => `/Exercises/percent/${id}`,
        }),
    }),
});

export const {
    useGetExercisesQuery,
    useGetExerciseByIdQuery,
    useCreateExerciseMutation,
    useGetExerciseStatsQuery,
} = exercisesApi;
