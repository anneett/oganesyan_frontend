import { useState } from "react";
import { useLoginMutation } from "./authApi";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

export const Login = () => {
    const navigate = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loginRequest, { error, isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginRequest({ login, password }).unwrap();
            localStorage.setItem("access_token", response.accessToken.token);
            localStorage.setItem("refresh_token", response.refreshToken);
            navigate("/exercises");
        } catch (error) {
            console.log("Login error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-background border border-secondary/30 rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    SQL-тренажер
                </h2>
                <h3 className="text-xl text-text/80 text-center mb-8">
                    Вход в систему
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Логин"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            className="w-full px-4 py-3 pr-12 bg-background border border-secondary/50 rounded-lg text-text placeholder-text/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 bg-background border border-secondary/50 rounded-lg text-text placeholder-text/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-background font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Вход..." : "Войти"}
                    </button>
                </form>

                {error && (
                    <p className="mt-4 text-center text-red-500 bg-red-500/10 py-2 rounded-lg">
                        Неверный логин или пароль
                    </p>
                )}

                <p className="mt-6 text-center text-text/70 text-sm">
                    Нет аккаунта?{" "}
                    <Link
                        to="/signup"
                        className="text-accent hover:text-accent/80 font-medium transition-colors"
                    >
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
};