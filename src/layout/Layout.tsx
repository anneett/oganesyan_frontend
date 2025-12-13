import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useGetUserProfileQuery } from "../features/users/usersApi";
import sqlLogo from "../assets/sql-logo.svg";

export const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { data: user } = useGetUserProfileQuery();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setIsMenuOpen(false);
        navigate("/login");
    };

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        {
            to: "/exercises",
            label: "Задания",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            to: "/profile",
            label: "Профиль",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            to: "/solutions",
            label: "Мои решения",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    const adminItems = [
        {
            to: "/users",
            label: "Пользователи",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            to: "/solutions",
            label: "Решения",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
        },
        {
            to: "/add-exercise",
            label: "Добавить задание",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-background border-r border-secondary/20 z-50 transform transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="p-3.5 border-b border-secondary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-background uppercase">
                                {user?.userName?.charAt(0) || user?.login?.charAt(0) || "?"}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium text-text text-sm">{user?.userName}</p>
                            <p className="text-text/50 text-xs">@{user?.login}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 text-text/50 hover:text-text hover:bg-secondary/20 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    <p className="text-text/40 text-xs uppercase tracking-wider mb-2 px-3">Навигация</p>

                    {menuItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                isActive(item.to)
                                    ? "bg-primary/20 text-primary"
                                    : "text-text/70 hover:text-text hover:bg-secondary/20"
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {isActive(item.to) && (
                                <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                        </Link>
                    ))}

                    {user?.isAdmin && (
                        <>
                            <div className="pt-4 pb-2">
                                <p className="text-text/40 text-xs uppercase tracking-wider px-3 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Администратор
                                </p>
                            </div>

                            {adminItems.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                        isActive(item.to)
                                            ? "bg-accent/20 text-accent"
                                            : "text-text/70 hover:text-text hover:bg-secondary/20"
                                    }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {isActive(item.to) && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />
                                    )}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary/20">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Выйти</span>
                    </button>
                </div>
            </aside>

            <header className="sticky top-0 z-30 border-b border-secondary/20 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 text-text/70 hover:text-text hover:bg-secondary/20 rounded-lg transition-colors"
                            aria-label="Открыть меню"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <Link to="/exercises" className="flex items-center gap-3">
                            <img src={sqlLogo} alt="SQL Trainer" className="h-10 w-auto" />
                            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                SQL-тренажер
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.isAdmin && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Админ
                            </span>
                        )}

                        <Link
                            to="/profile"
                            className="flex items-center gap-2 p-1.5 pr-3 bg-secondary/10 hover:bg-secondary/20 rounded-full transition-colors"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-background uppercase">
                                    {user?.userName?.charAt(0) || "?"}
                                </span>
                            </div>
                            <span className="hidden sm:block text-sm text-text/70">
                                {user?.userName}
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                <Outlet />
            </main>

            <footer className="border-t border-secondary/20 bg-background/50">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-center">
                        <p className="text-text/50 text-sm">
                            © 2025 SQL-тренажер. Практикуй SQL-запросы
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};