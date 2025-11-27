import { Outlet, Link } from "react-router-dom";

export const Layout = () => {
    return (
        <>
            <div className="pattern" />
            <header className="wrapper">
                <h1>
                    <h1>Практикуй свои навыки с различными <span className="text-gradient">СУБД</span></h1>
                </h1>
                <nav style={{ display: "flex", gap: "20px" }}>
                    <Link to="/exercises">Exercises</Link>
                </nav>
            </header>

            <main className="wrapper">
                <Outlet />
            </main>

            <footer className="wrapper">
                <p>© 2025. Платформа для практической работы с различными СУБД</p>
            </footer>
        </>
    )
}