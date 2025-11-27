import { configureStore } from '@reduxjs/toolkit';
import { authApi } from "../features/auth/authApi.ts";
import { exercisesApi } from "../features/exercises/exercisesApi.ts";
import { usersApi } from "../features/users/usersApi.ts";
import { solutionsApi } from "../features/solutions/solutionsApi.ts";

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [exercisesApi.reducerPath]: exercisesApi.reducer,
        [usersApi.reducerPath]: usersApi.reducer,
        [solutionsApi.reducerPath]: solutionsApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            exercisesApi.middleware,
            usersApi.middleware,
            solutionsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;