import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../app/baseQuery";

export interface DbMeta {
    id: number;
    dbType: string;
    provider: string;
}

export interface DbMetaCreateRequest {
    dbType: string;
    connectionString: string;
}

export interface DbConnectionTestResponse {
    success: boolean;
    message: string;
}

export interface DatabaseDeployment {
    id: number;
    databaseMetaId: number;
    dbMetaId: number;
    physicaDatabaseName: string;
    isDeployed: boolean;
    deployedAt: string;
    dbMeta?: DbMeta | null;
}

export interface DatabaseMeta {
    id: number;
    logicalName: string;
    description: string;
    erdImagePath: string | null;
    createScriptTemplate: string | null;
    createdAt: string;
    deployments?: DatabaseDeployment[];
}

export interface CreateDatabaseMetaRequest {
    logicalName: string;
    description: string;
    createScriptTemplate: string;
    erdImage?: File | null;
}

export interface CreateDatabaseMetaResponse {
    id: number;
    logicalName: string;
}

export interface DeployDatabaseRequest {
    dbMetaId: number;
    physicalDatabaseName: string;
    executeScript: boolean;
}

export interface DeployDatabaseResponse {
    id?: number;
    physicaDatabaseName?: string;
    isDeployed?: boolean;
    message?: string;
}

const buildDatabaseMetaFormData = (payload: CreateDatabaseMetaRequest) => {
    const formData = new FormData();
    formData.append("logicalName", payload.logicalName);
    formData.append("description", payload.description);
    formData.append("createScriptTemplate", payload.createScriptTemplate);

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
        getDatabaseDeploymentsByMetaId: builder.query<DatabaseDeployment[], number>({
            query: (metaId) => `/DatabaseDeployments/${metaId}`,
            providesTags: (_result, _error, metaId) => [{ type: "DatabaseDeployments", id: metaId }],
        }),
        deployDatabase: builder.mutation<DeployDatabaseResponse, { databaseMetaId: number; payload: DeployDatabaseRequest }>({
            query: ({ databaseMetaId, payload }) => ({
                url: `/DatabaseDeployments/deploy/${databaseMetaId}`,
                method: "POST",
                body: payload,
            }),
            invalidatesTags: (_result, _error, { databaseMetaId }) => [
                { type: "DatabaseDeployments", id: databaseMetaId },
                "DatabaseMetas",
            ],
        }),
    }),
});

export const {
    useGetDbMetasQuery,
    useCreateDbMetaMutation,
    useTestDbConnectionMutation,
    useGetDatabaseMetasQuery,
    useGetDatabaseMetaByIdQuery,
    useCreateDatabaseMetaMutation,
    useGetDatabaseDeploymentsByMetaIdQuery,
    useDeployDatabaseMutation,
} = databaseMetasApi;
