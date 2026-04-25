import { useState } from "react";
import { useCreateUserMutation } from "./usersApi.ts";
import { Link, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import * as React from "react";
import { getApiErrorMessage } from "../../app/getApiErrorMessage.ts";

const PasswordToggleIcon = ({ isVisible }: { isVisible: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {isVisible ? (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.248-3.592M6.228 6.228L3 3m3.228 3.228l3.65 3.65m0 0a3 3 0 104.244 4.244m-4.244-4.244L21 21"
            />
        ) : (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
            </>
        )}
    </svg>
);

export const SignUp = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [createUser, { error, isLoading }] = useCreateUserMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setFormError("Пароль и повтор пароля должны совпадать.");
            return;
        }

        if (!password.trim()) {
            setFormError("Введите пароль.");
            return;
        }

        setFormError(null);
        const passwordHash = CryptoJS.SHA256(password).toString();

        try {
            await createUser({
                userName,
                login,
                passwordHash,
            }).unwrap();

            navigate("/login");
        }
        catch (requestError) {
            console.error("Ошибка регистрации:", requestError);
            setFormError(getApiErrorMessage(requestError, "Ошибка регистрации. Попробуйте другой логин."));
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-background border border-secondary/30 rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    SQL-тренажер
                </h2>
                <h3 className="text-xl text-text/80 text-center mb-8">
                    Регистрация
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Имя пользователя"
                            value={userName}
                            onChange={(e) => {
                                setUserName(e.target.value);
                                setFormError(null);
                            }}
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
                            type="text"
                            placeholder="Логин"
                            value={login}
                            onChange={(e) => {
                                setLogin(e.target.value);
                                setFormError(null);
                            }}
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
                            type={showPassword ? "text" : "password"}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setFormError(null);
                            }}
                            className="w-full px-4 py-3 pr-12 bg-background border border-secondary/50 rounded-lg text-text placeholder-text/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary transition hover:text-text"
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        >
                            <PasswordToggleIcon isVisible={showPassword} />
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Повтор пароля"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setFormError(null);
                            }}
                            className="w-full px-4 py-3 pr-12 bg-background border border-secondary/50 rounded-lg text-text placeholder-text/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary transition hover:text-text"
                            aria-label={showConfirmPassword ? "Скрыть повтор пароля" : "Показать повтор пароля"}
                        >
                            <PasswordToggleIcon isVisible={showConfirmPassword} />
                        </button>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-background font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed">
                        {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                    </button>
                </form>

                {(formError || error) && (
                    <p className="mt-4 text-center text-red-500 bg-red-500/10 py-2 rounded-lg">
                        {formError ?? "Ошибка регистрации. Попробуйте другой логин."}
                    </p>
                )}

                <p className="mt-6 text-center text-text/70 text-sm">
                    Уже есть аккаунт?{" "}
                    <Link to="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">Войти</Link>
                </p>
            </div>
        </div>
    );
};
