import React, { useEffect, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { useUser } from "../../context/UserContext";
import { Navigate } from "react-router-dom";

function TeamsTabWithSSO() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [userLoggedIn, setUserLoggedIn] = useState(localStorage.getItem("user") ? true : false);
    const { login } = useUser();

    useEffect(() => {
        async function init() {
            if (!userLoggedIn) {
                try {
                    await microsoftTeams.app.initialize();
                    const token = await microsoftTeams.authentication.getAuthToken({
                        resources: ["api://booking.dovecgroup.com/" + import.meta.env.VITE_CLIENT_ID]
                    });

                    console.log("Token received from Teams:", token);

                    const response = await fetch(`${import.meta.env.VITE_API_URI}token?token=${token}`);
                    if (!response.ok) {
                        throw new Error(`HTTP status ${response.status}: ${await response.text()}`);
                    }
                    const data = await response.json();
                    const userData = {
                        name: data.displayName,
                        email: data.mail,
                        aad_id: data.id,
                        role: "user"
                    };
                    const checkUserResponse = await fetch(`${import.meta.env.VITE_API_URI}users/check-user`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                        },
                        body: JSON.stringify({ email: data.mail }),
                    });
                    const checkUserData = await checkUserResponse.json();
                    if (!checkUserData.userExists || checkUserData.userExists === false) {
                        const addUserResponse = await fetch(`${import.meta.env.VITE_API_URI}users/add-user`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                            },
                            body: JSON.stringify(userData),
                        });
                        const addedUser = await addUserResponse.json();
                        login(addedUser.user);
                    } else {
                        login(checkUserData.user);
                    }
                    setData(data);
                    setUserLoggedIn(true);
                } catch (err) {
                    console.error("Error getting Teams auth token:", err);
                    setError("Could not get SSO token: " + err.message);
                }
            }
        }

        init();
    }, [userLoggedIn]);  // Dependency to ensure useEffect runs again if userLoggedIn changes

    if (!userLoggedIn) {
        return <p>Loading...</p>;  // or another placeholder
    }

    if (error) return <p>Error: {error}</p>;
    if (!data) return <p>Loading data...</p>;

    return <Navigate replace to="/" />;
}


export default TeamsTabWithSSO;
