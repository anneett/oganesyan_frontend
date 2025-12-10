import { useState } from "react";
import { useLoginMutation } from "./authApi";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

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
        }
        catch (error) {
            console.log("Login error:", error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="text-gradient">SQL-тренажер</h2>
                <h3>Вход в систему</h3>
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Логин"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Вход..." : "Войти"}
                    </button>
                </form>

                {error && <p className="error">Неверный логин или пароль</p>}

                <p className="small">
                    Нет аккаунта?{" "}
                    <Link to="/signup">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}