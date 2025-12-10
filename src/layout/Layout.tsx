import { Outlet} from "react-router-dom";
import './Layout.css'

export const Layout = () => {
    return (
        <>
            <header className="header">
                <h2 className="logo">Система тренировки</h2>
                <div className="header-right">
                    <h1 className="text-3xl font-bold mb-4 md:mb-0">
                        Практикуй свои навыки с различными{" "}
                        <span className="text-gradient">СУБД</span>
                    </h1>
                </div>
            </header>

            <main className="wrapper flex-grow py-8">
                <Outlet />
            </main>
            <footer className="footer">
                <p>© 2025. Платформа для практической работы с различными СУБД</p>
            </footer>
        </>
    );
};
