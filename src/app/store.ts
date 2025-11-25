import { configureStore } from '@reduxjs/toolkit';
import { exercisesApi } from "../features/exercises/exercisesApi";

export const store = configureStore({
    reducer: {
        [exercisesApi.reducerPath]: exercisesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(exercisesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;