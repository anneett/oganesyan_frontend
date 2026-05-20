import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

export const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5177";
export const API_BASE_URL = `${API_ORIGIN}/api`;

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

let refreshPromise: Promise<boolean> | null = null;

const clearAuthAndRedirect = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    if (window.location.pathname !== "/login") {
        window.location.replace("/login");
    }
};

const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
        clearAuthAndRedirect();
        return false;
    }

    const result = await rawBaseQuery(
        {
            url: "/Auth/refresh",
            method: "POST",
            body: { refreshToken },
        },
        {} as never,
        {} as never,
    );

    if ("error" in result || !result.data) {
        clearAuthAndRedirect();
        return false;
    }

    const data = result.data as { accessToken: { token: string }; refreshToken: string };
    localStorage.setItem("access_token", data.accessToken.token);
    localStorage.setItem("refresh_token", data.refreshToken);
    return true;
};

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
        return result;
    }

    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }

    const refreshSucceeded = await refreshPromise;

    if (!refreshSucceeded) {
        return result;
    }

    result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        clearAuthAndRedirect();
    }

    return result;
};
