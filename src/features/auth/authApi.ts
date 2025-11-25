import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface AuthOptions {
    issuer: string;
    audience: string;
    expireMinutes: number;
    refreshTokenExpireDays: number;
    key: string;
}

export const authApi = createApi({
    reducerPath: "Auth",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5177/api",
    }),
    endpoints: (builder) => ({
        login:
    })
})