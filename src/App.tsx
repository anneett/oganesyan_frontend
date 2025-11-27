import './App.css'
import { Provider } from 'react-redux'
import { store } from './app/store.ts'
import { LoginPage } from "./features/auth/LoginPage.tsx";
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import { ExercisesPage } from "./features/exercises/ExercisesPage.tsx";
import {RequireAuth} from "./features/auth/RequireAuth.tsx";
import {Layout} from "./layout/Layout.tsx";

const App = () => {
    return (
        <Provider store={store}>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<Layout />}>
                        <Route path="/" element={<Navigate to="/exercises" />} />
                        <Route
                            path="/exercises"
                            element={
                                <RequireAuth>
                                    <ExercisesPage />
                                </RequireAuth>
                            }
                        />
                    </Route>
                </Routes>
            </Router>
        </Provider>
    );
};

export default App;
