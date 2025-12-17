import { Navigate } from "react-router-dom";
import { useGetUserProfileQuery } from "../users/usersApi";
import type { JSX } from "react";

export const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem("access_token");
    const { data: user, isLoading } = useGetUserProfileQuery(undefined, {
        skip: !token,
    });

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text/70">Проверка прав доступа...</p>
                </div>
            </div>
        );
    }

    if (!user?.isAdmin) {
        return <Navigate to="/exercises" replace />;
    }

    return children;
};