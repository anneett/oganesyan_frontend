import { useState } from "react";
import { useCreateUserMutation } from "./usersApi.ts";
import { Link, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import * as React from "react";
import "../auth/LoginPage.css";

export const SignUp = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const [createUser, { error, isLoading }] = useCreateUserMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const passwordHash = CryptoJS.SHA256(password).toString();

        try {
            await createUser({
                userName,
                login,
                passwordHash,
            }).unwrap();

            navigate("/login");
        }
        catch (error) {
            console.error("Ошибка регистрации:", error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="text-gradient">SQL-тренажер</h2>
                <h3>Регистрация</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Имя пользователя"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
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

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                    </button>
                </form>

                {error && <p className="error">Ошибка регистрации. Попробуйте другой логин.</p>}
                <p className="small">
                    Уже есть аккаунт?{" "}
                    <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    );
}