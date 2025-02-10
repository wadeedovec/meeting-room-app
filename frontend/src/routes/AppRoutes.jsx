import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CalendarPage from "../pages/CalendarPage";
import NewReservation from "../pages/NewReservation";
import Reservations from "../pages/Reservations";
import DashboardPage from "../pages/DashboardPage";
import Login from "../pages/Login";
import ProtectedRoutes from "./ProtectedRoutes";
import Layout from "../components/Layout";
import Logout from "../pages/logout";
const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoutes />}>
                    <Route
                        element={
                            <Layout>
                                <CalendarPage />
                            </Layout>
                        }
                        path="/"
                    />
                    <Route
                        element={
                            <Logout />
                        }
                        path="/logout"
                    />
                </Route>
                <Route path="/:roomId" element={<Layout><CalendarPage /></Layout>} />
            </Routes>
        </Router>
    );
};
export default AppRoutes;
