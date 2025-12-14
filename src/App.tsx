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
                            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                            <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
                            <Route path="/add-exercise" element={<RequireAuth><Add_Exercise /></RequireAuth>} />
                            <Route path="/exercise/:id" element={<RequireAuth><Exercise /></RequireAuth>} />
                            <Route path="/solutions" element={<RequireAuth><Solutions /></RequireAuth>} />
                        </Route>
                    </Routes>
                </Router>
            </div>
        </Provider>
    );
};

export default App;