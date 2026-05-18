import { createApi } from "@reduxjs/toolkit/query/react";
import CryptoJS from "crypto-js";
import { baseQuery } from "../../app/baseQuery";

export interface LoginRequest {
    login: string;
    password: string;
}

export interface AuthResponse {
    accessToken: {
        token: string;
    };
    refreshToken: string;
}

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: baseQuery,
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: ({ login, password }) => {
                const passwordHash = CryptoJS.SHA256(password).toString();

                return {
                    url: "/Auth/login",
                    method: "POST",
                    body: { login, frontendHash: passwordHash },
                };
            },
        }),
    }),
});

export const { useLoginMutation } = authApi;