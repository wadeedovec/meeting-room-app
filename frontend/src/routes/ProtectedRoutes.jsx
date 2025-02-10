import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const ProtectedRoute = () => {
    const { user, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
