import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const API_ORIGIN = "http://localhost:5177";
export const API_BASE_URL = `${API_ORIGIN}/api`;

export const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});
