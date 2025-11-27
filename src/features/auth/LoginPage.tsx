import { useState } from "react";
import { useLoginMutation } from "./authApi";
import * as React from "react";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
    const navigate = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const [loginRequest, { data, error, isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await loginRequest({ login, password }).unwrap();
            localStorage.setItem("access_token", response.accessToken.token);
            localStorage.setItem("refresh_token", response.refreshToken);
        }
        catch (error) {
            console.log(error);
        }
};

    return (
        <div>
            <h2>Авторизация</h2>
            <form onSubmit={handleSubmit}>
                <input
                type="text"
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                />

                <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Войти</button>
            </form>

            {isLoading && <p>Авторизация...</p>}
            {error && <p>Ошибка авторизации</p>}
        </div>
    );
}