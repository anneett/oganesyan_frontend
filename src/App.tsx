import { Provider } from 'react-redux'
import { store } from './app/store.ts'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./layout/Layout.tsx";
import { Login } from "./features/auth/Login.tsx";
import { SignUp } from "./features/users/SignUp.tsx"
import { RequireAuth } from "./features/auth/RequireAuth.tsx";
import { Exercises } from "./features/exercises/Exercises.tsx";
import { Exercise } from "./features/exercises/Exercise.tsx";
import { Add_Exercise } from "./features/exercises/Add_Exercise.tsx";
import { Profile } from "./features/users/Profile.tsx";
import { Users } from "./features/users/Users.tsx";
import { Solutions } from "./features/solutions/Solutions.tsx";
import { RequireAdmin } from "./features/auth/RequireAdmin.tsx";
import { DatabaseStudio } from "./features/databaseStudio/DatabaseStudio.tsx";
import { ExamMode } from "./features/exams/ExamMode.tsx";
import {ExamResults} from "./features/exams/ExamResults.tsx";
import { ExamManagement } from "./features/exams/ExamManagement.tsx";

const App = () => {
    return (
        <Provider store={store}>
            <div className="dark">
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />

                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/login" />} />
                            <Route path="/exercises" element={<RequireAuth><Exercises /></RequireAuth>} />
                            <Route path="/exam" element={<RequireAuth><ExamMode /></RequireAuth>} />
                            <Route path="/exam/:examId/results" element={<RequireAuth><ExamResults /></RequireAuth>} />
                            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                            <Route path="/exercise/:id" element={<RequireAuth><Exercise /></RequireAuth>} />

                            <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
                            <Route path="/add-exercise" element={<RequireAdmin><Add_Exercise /></RequireAdmin>} />
                            <Route path="/solutions" element={<RequireAdmin><Solutions /></RequireAdmin>} />
                            <Route path="/admin/databases" element={<RequireAdmin><DatabaseStudio /></RequireAdmin>} />
                            <Route path="/admin/exams" element={<RequireAdmin><ExamManagement /></RequireAdmin>} />
                        </Route>
                    </Routes>
                </Router>
            </div>
        </Provider>
    );
};

export default App;
