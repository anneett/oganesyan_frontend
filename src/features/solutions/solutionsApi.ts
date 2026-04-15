import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../app/baseQuery";
import type { Exercise } from "../exercises/exercisesApi";

export interface Solution {
    id: number;
    userId: number;
    exerciseId: number;
    deploymentId: number;
    exercise?: Exercise;
    userAnswer: string;
    isCorrect: boolean;
    submittedAt: string;
    result: string | null;
}

export interface CreateSolutionRequest {
    exerciseId: number;
    deploymentId: number;
    userAnswer: string;
}

export interface ExerciseStatsDto {
    exerciseId: number;
    exerciseTitle: string;
    totalAttempts: number;
    uniqueUsers: number;
    correctAnswers: number;
    percentCorrect: number;
}

export interface UserStatsDto {
    userId: number;
    userLogin: string;
    totalAttempts: number;
    uniqueExercises: number;
    correctAnswers: number;
    percentCorrect: number;
}

export const solutionsApi = createApi({
    reducerPath: "solutionsApi",
    baseQuery,
    endpoints: (builder) => ({
        createSolution: builder.mutation<Solution, CreateSolutionRequest>({
            query: (payload) => ({
                url: "/Solutions/add",
                method: "POST",
                body: payload,
            }),
        }),
        getExercisesStats: builder.query<ExerciseStatsDto[], void>({
            query: () => "/Solutions/exercises-percent",
        }),
        getUsersStats: builder.query<UserStatsDto[], void>({
            query: () => "/Solutions/users-percent",
        }),
    }),
});

export const {
    useCreateSolutionMutation,
    useGetExercisesStatsQuery,
    useGetUsersStatsQuery,
} = solutionsApi;
