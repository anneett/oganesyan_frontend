import { Outlet, Link } from "react-router-dom";

export const Layout = () => {
    return (
        <>
            <header className="wrapper py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <h1 className="text-3xl font-bold mb-4 md:mb-0">
                        Практикуй свои навыки с различными{" "}
                        <span className="text-gradient">СУБД</span>
                    </h1>
                    <nav className="flex gap-4">
                        <Link
                            to="/exercises"
                            className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                            Упражнения
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="wrapper flex-grow py-8">
                <Outlet />
            </main>
            <footer className="wrapper py-4 text-sm opacity-70 text-center">
                <p>© 2025. Платформа для практической работы с различными СУБД</p>
            </footer>
        </>
    );
};
