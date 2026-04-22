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

export interface TestQueryRequest {
    deploymentId: number;
    query: string;
}

export interface QueryResult {
    isCorrect: boolean;
    message: string;
    userRowCount: number;
    userColumnCount: number;
    columnNames: string[];
    userRows: string[][];
    errorDetails?: string;
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
        testQuery: builder.mutation<QueryResult, TestQueryRequest>({
            query: (payload) => ({
                url: "/Exercises/test-query",
                method: "POST",
                body: payload,
            }),
        }),
    }),
});

export const {
    useGetExercisesQuery,
    useGetExerciseByIdQuery,
    useCreateExerciseMutation,
    useGetExerciseStatsQuery,
    useTestQueryMutation,
} = exercisesApi;
