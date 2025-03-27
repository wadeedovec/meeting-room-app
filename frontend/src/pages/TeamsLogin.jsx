import * as microsoftTeams from "@microsoft/teams-js";
import React, { useEffect, useState } from "react";

function TeamsLogin() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        microsoftTeams.app.initialize().then(() => {
            getClientSideToken()
                .then(clientSideToken => {
                    console.log("Client-side token:", clientSideToken);
                    // Here, getServerSideToken would ideally be a call to your backend
                    return getServerSideToken(clientSideToken);
                })
                .then(profile => {
                    console.log("Profile received:", profile);
                    setUser(profile);
                })
                .catch(err => {
                    console.error("Authentication error:", err);
                    setError(err.toString());
                });
        }).catch(err => {
            console.error("Failed to initialize Microsoft Teams SDK:", err);
            setError("Failed to initialize Microsoft Teams SDK: " + err);
        });
    }, []);

    function getClientSideToken() {
        return microsoftTeams.authentication.getAuthToken().then(token => {
            console.log("Received token:", token);
            return token;
        }).catch(error => {
            throw new Error("Error getting token: " + error);
        });
    }


    function getServerSideToken(clientSideToken) {
        // Placeholder function: Implement according to your backend API
        return new Promise((resolve, reject) => {
            // Simulate API call
            setTimeout(() => resolve({ name: "John Doe" }), 1000);
        });
    }

    if (error) return <p>Error: {error}</p>;
    return (
        <div>
            <h1>Teams Login</h1>
            <p>Teams user: {user ? user.name : "Loading..."}</p>
        </div>
    );
}

export default TeamsLogin;
