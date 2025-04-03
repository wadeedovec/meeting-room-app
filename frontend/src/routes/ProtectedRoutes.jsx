import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import * as microsoftTeams from '@microsoft/teams-js';

const ProtectedRoute = () => {
    const { user, loading } = useUser();
    const [isTeamsEnvironment, setIsTeamsEnvironment] = useState(false);

    useEffect(() => {
        microsoftTeams.app.initialize();
        microsoftTeams.app.getContext((context) => {
            if (context) {
                setIsTeamsEnvironment(true);
            } else {
                setIsTeamsEnvironment(false);
            }
        });
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    // Redirect logic based on the environment
    if (!user) {
        if (isTeamsEnvironment) {
            // Redirect to Teams specific login if it's inside Microsoft Teams
            return <Navigate to="/teamslogin" replace />;
        } else {
            // Redirect to regular login if not inside Teams
            return <Navigate to="/login" replace />;
        }
    }

    // Render children routes if user is authenticated
    return <Outlet />;
};

export default ProtectedRoute;
