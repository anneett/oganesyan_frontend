import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
    id: number;
    username: string;
    login: string;
    isAdmin: boolean;
}

export interface CreateUserRequest {
    userName: string;
    login: string;
    passwordHash: string;
}

export const usersApi = createApi({
    reducerPath: "users",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5177/api",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as any).auth.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        createUser: builder.mutation<User, CreateUserRequest>({
            query: (newUser) => ({
                url: '/Users/add',
                method: 'POST',
                body: newUser,
            }),
        }),
        getUserById: builder.query<User, number>({
            query: (id) => `/Users/${id}`,
        }),
        getUsers: builder.query<User[], void>({
            query: () => '/Users/all',
        }),
        getUserProfile: builder.query<User, void>({
            query: () => '/Users/profile',
        }),
        updateUser: builder.mutation<User, void>({
            query: () => '/Users/update',
            // Создание или обновление?
        }),
        updateUserById: builder.mutation<User, number>({
            query: (id) => `/Users/update/${id}`,
            // Создание или обновление?
        }),
        changeUser: builder.mutation<User, number>({
            query: (id) => `/Users/change/${id}`,
            // Обновление?
        }),
        deleteUser: builder.mutation<User>({
            query: () => 'Users/selfdelete',
            // Как удаление реализовать?
        }),
        deleteUserById: builder.mutation<User, number>({
            query: (id) => `Users/delete/${id}`,
            // Как удаление реализовать?
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserProfileQuery,
    useCreateUserMutation,
} = usersApi;