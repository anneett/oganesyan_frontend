import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../app/baseQuery";

export interface DeploymentInfoDto {
    id: number;
    dbType: string;
    provider: string;
}

export interface Exam {
    id: number;
    title: string;
    description: string;
    durationMinutes: number;
    maxAttempts: number | null;
    isActive: boolean;
    isResultsReleased: boolean;
    logicalDbName: string;
    databaseMetaId: number;
    availablePlatforms: DeploymentInfoDto[];
}

export interface ExamCreateRequest {
    title: string;
    description: string;
    databaseMetaId: number;
    durationMinutes: number;
    maxAttempts: number | null;
    deploymentIds: number[];
}

export interface UserExamInfo {
    examId: number;
    maxAttempts: number | null;
    completedAttempts: number;
    remainingAttempts: number | null;
    hasUnfinishedAttempt: boolean;
    canStart: boolean;
}

export interface ExamStartRequest {
    examId: number;
    deploymentId: number;
}

export interface ExamAttempt {
    id: number;
    userId: number;
    examId: number;
    selectedDeploymentId: number;
    startedAt: string;
    finishedAt: string | null;
}

export interface ExamAttemptWithDetails {
    id: number;
    userId: number;
    userLogin: string;
    userName: string;
    startedAt: string;
    finishedAt: string | null;
    correctAnswers: number;
    totalAnswers: number;
}

export interface ExamResultsResponse {
    isResultsReleased: boolean;
    message?: string;
    submittedCount?: number;
    startedAt?: string;
    finishedAt?: string | null;
    solutions?: Array<{
        exerciseId: number;
        exerciseTitle: string;
        userAnswer: string;
        isCorrect: boolean;
        result: string | null;
    }>;
    correctAnswers?: number;
    totalExercises?: number;
}

export const examsApi = createApi({
    reducerPath: "examsApi",
    baseQuery,
    tagTypes: ["Exams", "ExamAttempts", "ExamResults"],
    endpoints: (builder) => ({
        getActiveExams: builder.query<Exam[], void>({
            query: () => "/Exams/active",
            providesTags: ["Exams"],
        }),
        startExam: builder.mutation<ExamAttempt, ExamStartRequest>({
            query: (payload) => ({
                url: "/Exams/start",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["ExamAttempts"],
        }),
        finishExam: builder.mutation<void, number>({
            query: (examId) => ({
                url: `/Exams/finish/${examId}`,
                method: "POST",
            }),
            invalidatesTags: ["ExamAttempts", "ExamResults"],
        }),
        getMyResults: builder.query<ExamResultsResponse, number>({
            query: (examId) => `/Exams/${examId}/my-results`,
            providesTags: ["ExamResults"],
        }),
        createExam: builder.mutation<Exam, ExamCreateRequest>({
            query: (payload) => ({
                url: "/Exams/create",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Exams"],
        }),
        releaseResults: builder.mutation<void, number>({
            query: (id) => ({
                url: `/Exams/${id}/release-results`,
                method: "PATCH",
            }),
            invalidatesTags: ["Exams", "ExamResults"],
        }),
        getExamAttempts: builder.query<ExamAttemptWithDetails[], number>({
            query: (examId) => `/Exams/${examId}/attempts`,
            providesTags: ["ExamAttempts"],
        }),
        getUserExamInfo: builder.query<UserExamInfo, number>({
            query: (examId) => `/Exams/${examId}/user-info`,
            providesTags: ["ExamAttempts"],
        }),
    }),
});

export const {
    useGetActiveExamsQuery,
    useCreateExamMutation,
    useStartExamMutation,
    useFinishExamMutation,
    useGetMyResultsQuery,
    useReleaseResultsMutation,
    useGetExamAttemptsQuery,
    useGetUserExamInfoQuery,
} = examsApi;