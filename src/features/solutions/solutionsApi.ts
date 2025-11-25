import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {Exercise} from "../exercises/exercisesApi.ts";

export interface Solution {
    id: number;
    userId: number;
    exerciseId: number;
    exercise: Exercise;
    userAnswer: string;
    isCorrect: boolean;
    submittedAd: Date;
    result: Solution;
}

export const solutionsApi = createApi({
    reducerPath: 'solutionsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:5177/api',
    }),
    endpoints: (builder) => ({
        createSolution: builder.mutation<Solution, Partial<Solution>>({
            query: (newSolution) => ({
                url: 'Solutions/add',
                method: 'POST',
                body: newSolution,
            })
        }),
        getSolutionById: builder.query<Solution, number>({
            query: (id) => `Solution/${id}`
        }),
        getSolutions: builder.query<Solution[], void>({
            query: () => 'Solutions/all',
        }),
    }),
})

export const {

} = solutionsApi;