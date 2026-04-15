import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import sqlLogo from "../assets/sql-logo.svg";
import { authApi } from "../features/auth/authApi";
import { databaseMetasApi } from "../features/databaseMetas/databaseMetasApi";
import { exercisesApi } from "../features/exercises/exercisesApi";
import { solutionsApi } from "../features/solutions/solutionsApi";
import { useGetUserProfileQuery, usersApi } from "../features/users/usersApi";

type NavItem = {
    to: string;
    label: string;
    icon: ReactNode;
};

const userMenuItems: NavItem[] = [
    {
        to: "/exercises",
        label: "Задания",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 8 2 2 4-4" />
            </svg>
        ),
    },
    {
        to: "/exam",
        label: "Контрольная",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    {
        to: "/profile",
        label: "Профиль",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-8 9a6 6 0 0 0-6 6h20a6 6 0 0 0-6-6H8Z" />
            </svg>
        ),
    },
];

const adminMenuItems: NavItem[] = [
    {
        to: "/admin/databases",
        label: "Базы данных",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3-3.582 3-8 3-8-1.343-8-3Zm0 5c0 1.657 3.582 3 8 3s8-1.343 8-3m-16 5c0 1.657 3.582 3 8 3s8-1.343 8-3" />
            </svg>
        ),
    },
    {
        to: "/add-exercise",
        label: "Новое задание",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14m-7-7h14" />
            </svg>
        ),
    },
    {
        to: "/solutions",
        label: "Статистика",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 18v-5m5 5V6m5 12v-8" />
            </svg>
        ),
    },
    {
        to: "/users",
        label: "Пользователи",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20a5 5 0 0 0-10 0m13 0a4 4 0 0 0-3-3.873M4 20a4 4 0 0 1 3-3.873M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
            </svg>
        ),
    },
];

const isPathActive = (pathname: string, target: string) => {
    if (target === "/exercises" && pathname.startsWith("/exercise/")) {
        return true;
    }

    return pathname === target || pathname.startsWith(`${target}/`);
};

export const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data: user } = useGetUserProfileQuery();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        dispatch(authApi.util.resetApiState());
        dispatch(usersApi.util.resetApiState());
        dispatch(exercisesApi.util.resetApiState());
        dispatch(solutionsApi.util.resetApiState());
        dispatch(databaseMetasApi.util.resetApiState());

        setIsMenuOpen(false);
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(55,95,110,0.18),_transparent_35%),linear-gradient(180deg,_rgba(16,20,26,1)_0%,_rgba(11,14,19,1)_100%)] text-text">
            {isMenuOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Закрыть меню"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[19rem] border-r border-white/8 bg-[#101820]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                    <Link to="/exercises" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                        <img src={sqlLogo} alt="SQL Trainer" className="h-10 w-auto" />
                        <div>
                            <p className="text-sm font-medium text-text/55">Практика и контроль</p>
                            <p className="text-lg font-semibold text-text">SQL-тренажер</p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        className="rounded-xl p-2 text-text/50 transition hover:bg-white/6 hover:text-text lg:hidden"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Закрыть меню"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="border-b border-white/8 px-5 py-5">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent text-lg font-bold text-background shadow-lg shadow-primary/15">
                            {user?.userName?.charAt(0) || user?.login?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-text">{user?.userName || "Пользователь"}</p>
                            <p className="truncate text-sm text-text/50">@{user?.login || "guest"}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex h-[calc(100%-220px)] flex-col gap-6 overflow-y-auto px-4 py-5">
                    <div>
                        <p className="px-3 pb-2 text-xs uppercase tracking-[0.22em] text-text/35">Основное</p>
                        <div className="space-y-1.5">
                            {userMenuItems.map((item) => {
                                const active = isPathActive(location.pathname, item.to);

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                                            active
                                                ? "bg-gradient-to-r from-primary/18 via-primary/10 to-accent/18 text-text shadow-lg shadow-primary/5"
                                                : "text-text/65 hover:bg-white/6 hover:text-text"
                                        }`}
                                    >
                                        <span className={active ? "text-primary" : "text-text/45 group-hover:text-accent"}>{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                        {active && <span className="ml-auto h-2 w-2 rounded-full bg-accent" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {user?.isAdmin && (
                        <div>
                            <p className="px-3 pb-2 text-xs uppercase tracking-[0.22em] text-text/35">Администрирование</p>
                            <div className="space-y-1.5">
                                {adminMenuItems.map((item) => {
                                    const active = isPathActive(location.pathname, item.to);

                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                                                active
                                                    ? "bg-gradient-to-r from-accent/22 to-secondary/18 text-text shadow-lg shadow-accent/5"
                                                    : "text-text/65 hover:bg-white/6 hover:text-text"
                                            }`}
                                        >
                                            <span className={active ? "text-accent" : "text-text/45 group-hover:text-secondary"}>{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                            {active && <span className="ml-auto h-2 w-2 rounded-full bg-secondary" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="absolute inset-x-0 bottom-0 border-t border-white/8 bg-[#101820] px-4 py-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                        </svg>
                        Выйти из аккаунта
                    </button>
                </div>
            </aside>

            <div className="lg:pl-[19rem]">
                <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0d1218]/82 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(true)}
                                className="rounded-2xl border border-white/8 bg-white/4 p-2.5 text-text/70 transition hover:bg-white/8 hover:text-text lg:hidden"
                                aria-label="Открыть меню"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                                </svg>
                            </button>

                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-text/35">SQL Workspace</p>
                                <h1 className="text-lg font-semibold text-text">
                                    {location.pathname.startsWith("/admin")
                                        ? "Панель управления"
                                        : location.pathname === "/exam"
                                            ? "Режим контрольной"
                                            : "Учебный портал"}
                                </h1>
                            </div>
                        </div>

                        <Link
                            to="/profile"
                            className="flex items-center gap-3 rounded-full border border-white/8 bg-white/4 px-2 py-2 pr-4 transition hover:bg-white/8"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-background">
                                {user?.userName?.charAt(0) || user?.login?.charAt(0) || "?"}
                            </div>
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-medium text-text">{user?.userName || "Профиль"}</p>
                                <p className="text-xs text-text/45">{user?.isAdmin ? "Администратор" : "Студент"}</p>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-148px)]">
                    <Outlet />
                </main>

                <footer className="border-t border-white/8 bg-[#0d1218]/82">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-text/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p>SQL-тренажер для практики, проверки и контрольных работ.</p>
                        <p>Выбор СУБД, реальные развертывания и проверка запросов по результату.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
