import { Provider } from 'react-redux'
import { store } from './app/store.ts'
import { Login } from "./features/auth/Login.tsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Exercises } from "./features/exercises/Exercises.tsx";
import { RequireAuth } from "./features/auth/RequireAuth.tsx";
import { Layout } from "./layout/Layout.tsx";
import { SignUp } from "./features/users/SignUp.tsx"
import { Profile } from "./features/users/Profile.tsx";
import { Exercise } from "./features/exercises/Exercise.tsx";
import { Users } from "./features/users/Users.tsx";
import { Add_Exercise } from "./features/exercises/Add_Exercise.tsx";
import './App.css'

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
                            {/*<Route path="/exercises-admin" element={<RequireAuth><Admin_Exercises /></RequireAuth>} />*/}
                            <Route path="/exercise/:id" element={<RequireAuth><Exercise /></RequireAuth>} />
                            {/*<Route path="/solutions" element={<RequireAuth><Solutions /></RequireAuth>} />*/}
                        </Route>
                    </Routes>
                </Router>
            </div>
        </Provider>
    );
};

export default App;
