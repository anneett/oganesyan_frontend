import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
    id: number;
    userName: string;
    login: string;
    isAdmin: boolean;
    inArchive: boolean;
}

export interface CreateUserRequest {
    userName: string;
    login: string;
    passwordHash: string;
}

export interface UserUpdateRequest {
    userName: string;
}

export interface UserSolution {
    solutionId: number;
    exerciseId: number;
    exerciseTitle: string;
    exerciseDifficulty: 0 | 1 | 2;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    submittedAt: string;
    result: string | null;
}

export const usersApi = createApi({
    reducerPath: "usersApi",
    tagTypes: ['Profile', 'Users'],
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5177/api",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("access_token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            return headers;
        }
    }),
    endpoints: (builder) => ({
        createUser: builder.mutation<User, CreateUserRequest>({
            query: (newUser) => ({
                url: '/Users/add',
                method: 'POST',
                body: newUser,
            }),
        }),
        getUsers: builder.query<User[], void>({
            query: () => '/Users/all',
            providesTags: ['Users'],
        }),
        getUserProfile: builder.query<User, void>({
            query: () => '/Users/profile',
            providesTags: ['Profile'],
        }),
        getUserStats: builder.query<UserSolution[], void>({
            query: () => '/Users/stat',
        }),
        updateUser: builder.mutation<void, UserUpdateRequest>({
            query: (data) => ({
                url: '/Users/update',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Profile'],
        }),
        changeUser: builder.mutation<void, number>({
            query: (id) => ({
                url: `/Users/change/${id}`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Users'],
        }),
        archiveUser: builder.mutation<void, number>({
            query: (id) => ({
                url: `/Users/archive/${id}`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    useCreateUserMutation,
    useGetUsersQuery,
    useGetUserProfileQuery,
    useGetUserStatsQuery,
    useUpdateUserMutation,
    useChangeUserMutation,
    useArchiveUserMutation,
} = usersApi;