import './App.css'
import { Provider } from 'react-redux'
import { store } from './app/store.ts'
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Exercises } from "./features/exercises/Exercises.tsx";
import { RequireAuth } from "./features/auth/RequireAuth.tsx";
import { Layout } from "./layout/Layout.tsx";
import { SignUp } from "./features/users/SignUp.tsx"
import { Profile } from "./features/users/Profile.tsx";
import { Exercise } from "./features/exercises/Exercise.tsx";

const App = () => {
    return (
        <Provider store={store}>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUp />} />

                    <Route element={<Layout />}>
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route
                            path="/exercises"
                            element={<RequireAuth><Exercises /></RequireAuth>}
                        />
                        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                        <Route path="/exercise/:id" element={<RequireAuth><Exercise /></RequireAuth>} />
                    </Route>
                </Routes>
            </Router>
        </Provider>
    );
};

export default App;
