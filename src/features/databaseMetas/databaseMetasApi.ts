import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../app/baseQuery";

export interface DbMeta {
    id: number;
    name: string;
    dbType: string;
    provider: string;
    createdAt: string;
    maskedConnectionString: string;
}

export interface DbMetaCreateRequest {
    name: string;
    dbType: string;
    connectionString: string;
}

export interface DbMetaUpdateRequest {
    name: string;
    dbType: string;
    connectionString?: string;
}

export interface DbConnectionTestResponse {
    success: boolean;
    message: string;
}

export interface DatabaseDeployment {
    id: number;
    databaseMetaId: number;
    dbMetaId: number;
    linkedAt: string;
    dbMeta?: DbMeta | null;
}

export interface DatabaseMeta {
    id: number;
    logicalName: string;
    physicalName: string;
    description: string;
    erdImagePath: string | null;
    createdAt: string;
    deployments: DatabaseDeployment[];
}

export interface CreateDatabaseMetaRequest {
    logicalName: string;
    physicalName: string;
    description: string;
    connectionIds: number[];
    erdImage?: File | null;
}

export interface CreateDatabaseMetaResponse {
    id: number;
    logicalName: string;
    physicalName: string;
}

export interface UpdateDatabaseMetaRequest {
    logicalName: string;
    physicalName: string;
    description: string;
    connectionIds: number[];
    removeErdImage?: boolean;
    erdImage?: File | null;
}

const buildDatabaseMetaFormData = (payload: CreateDatabaseMetaRequest | UpdateDatabaseMetaRequest) => {
    const formData = new FormData();
    formData.append("logicalName", payload.logicalName);
    formData.append("physicalName", payload.physicalName);
    formData.append("description", payload.description);
    payload.connectionIds.forEach((id) => formData.append("connectionIds", String(id)));
    if ("removeErdImage" in payload) {
        formData.append("removeErdImage", String(payload.removeErdImage ?? false));
    }
    if (payload.erdImage) {
        formData.append("erdImage", payload.erdImage);
    }
    return formData;
};

export const databaseMetasApi = createApi({
    reducerPath: "databaseMetasApi",
    baseQuery,
    tagTypes: ["DbMetas", "DatabaseMetas", "DatabaseDeployments"],
    endpoints: (builder) => ({
        getDbMetas: builder.query<DbMeta[], void>({
            query: () => "/DbMetas/all",
            providesTags: ["DbMetas"],
        }),
        createDbMeta: builder.mutation<DbMeta, DbMetaCreateRequest>({
            query: (payload) => ({
                url: "/DbMetas/add",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["DbMetas"],
        }),
        updateDbMeta: builder.mutation<DbMeta, { id: number; payload: DbMetaUpdateRequest }>({
            query: ({ id, payload }) => ({
                url: `/DbMetas/${id}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: ["DbMetas", "DatabaseMetas"],
        }),
        testDbConnection: builder.mutation<DbConnectionTestResponse, DbMetaCreateRequest>({
            query: (payload) => ({
                url: "/DbMetas/test",
                method: "POST",
                body: payload,
            }),
        }),
        getDatabaseMetas: builder.query<DatabaseMeta[], void>({
            query: () => "/DatabaseMetas/all",
            providesTags: ["DatabaseMetas"],
        }),
        getDatabaseMetaById: builder.query<DatabaseMeta, number>({
            query: (id) => `/DatabaseMetas/${id}`,
            providesTags: (_result, _error, id) => [{ type: "DatabaseMetas", id }],
        }),
        createDatabaseMeta: builder.mutation<CreateDatabaseMetaResponse, CreateDatabaseMetaRequest>({
            query: (payload) => ({
                url: "/DatabaseMetas/add",
                method: "POST",
                body: buildDatabaseMetaFormData(payload),
            }),
            invalidatesTags: ["DatabaseMetas"],
        }),
        updateDatabaseMeta: builder.mutation<DatabaseMeta, { id: number; payload: UpdateDatabaseMetaRequest }>({
            query: ({ id, payload }) => ({
                url: `/DatabaseMetas/${id}`,
                method: "PUT",
                body: buildDatabaseMetaFormData(payload),
            }),
            invalidatesTags: ["DatabaseMetas", "DatabaseDeployments"],
        }),
        getDatabaseDeploymentsByMetaId: builder.query<DatabaseDeployment[], number>({
            query: (metaId) => `/DatabaseDeployments/${metaId}`,
            providesTags: (_result, _error, metaId) => [{ type: "DatabaseDeployments", id: metaId }],
        }),
    }),
});

export const {
    useGetDbMetasQuery,
    useCreateDbMetaMutation,
    useUpdateDbMetaMutation,
    useTestDbConnectionMutation,
    useGetDatabaseMetasQuery,
    useGetDatabaseMetaByIdQuery,
    useCreateDatabaseMetaMutation,
    useUpdateDatabaseMetaMutation,
    useGetDatabaseDeploymentsByMetaIdQuery,
} = databaseMetasApi;
