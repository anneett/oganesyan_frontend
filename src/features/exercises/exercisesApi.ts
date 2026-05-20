import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../app/baseQuery";

export interface Exercise {
    id: number;
    title: string;
    difficulty: 1 | 2 | 3;
    databaseMetaId: number;
    correctAnswer: string;
    referenceDbType?: string | null;
}

export interface CreateExerciseRequest {
    title: string;
    difficulty: 1 | 2 | 3;
    databaseMetaId: number;
    correctAnswer: string;
    referenceDbType?: string;
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
    referenceRowCount?: number;
    referenceColumnCount?: number;
    referenceRows?: string[][];
    errorDetails?: string;
}

export interface BatchExerciseItem {
    title: string;
    difficulty?: 1 | 2 | 3;
    correctAnswer: string;
    referenceDbType?: string;
}

export interface BatchExerciseUpload {
    databaseMetaId: number;
    defaultDifficulty?: 1 | 2 | 3;
    referenceDbType?: string;
    exercises: BatchExerciseItem[];
}

export interface BatchUploadResult {
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    errors: BatchUploadError[];
}

export interface BatchUploadError {
    lineNumber: number;
    title: string;
    errorMessage: string;
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
        getExercises: builder.query<Exercise[], { databaseMetaId?: number } | void>({
            query: (params) => {
                const databaseMetaId = params && "databaseMetaId" in params ? params.databaseMetaId : undefined;
                return databaseMetaId ? `/Exercises/all?databaseMetaId=${databaseMetaId}` : "/Exercises/all";
            },
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
        batchUploadExercises: builder.mutation<BatchUploadResult, BatchExerciseUpload>({
            query: (payload) => ({
                url: "/Exercises/batch-upload",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Exercises"],
        }),
    }),
});

export const {
    useGetExercisesQuery,
    useGetExerciseByIdQuery,
    useCreateExerciseMutation,
    useGetExerciseStatsQuery,
    useTestQueryMutation,
    useBatchUploadExercisesMutation,
} = exercisesApi;
