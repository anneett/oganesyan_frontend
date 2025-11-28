import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import CryptoJS from "crypto-js";

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
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5177/api",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        }
    }),
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