import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
    id: number;
    username: string;
    login: string;
    passwordHash: string;
    salt: string;
    isAdmin: boolean;
}

export const usersApi = createApi({
    reducerPath: "users",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5177/api",
    }),
    endpoints: (builder) => createApi({
        createUser: builder.mutation<User, Partial<User>>({
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
        updateUser: builder.query<User, void>({
            query: () => '/Users/update',
            // Создание или обновление?
        }),
        updateUserById: builder.query<User, number>({
            query: (id) => `/Users/update/${id}`,
            // Создание или обновление?
        }),
        changeUser: builder.query<User, number>({
            query: (id) => `/Users/change/${id}`,
            // Обновление?
        }),
        deleteUser: builder.query<User>({
            query: () => 'Users/selfdelete',
            // Как удаление реализовать?
        })
        deleteUserById: builder.query<User, number>({
            query: (id) => `Users/delete/${id}`,
            // Как удаление реализовать?
        }),
    }),
});

export const {
    useGetUsersQuery,
} = usersApi;