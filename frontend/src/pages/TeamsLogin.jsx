import React, { useEffect, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';

function TeamsTabWithSSO() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        microsoftTeams.app.initialize();

        // Using the Promise-based approach to get the auth token
        microsoftTeams.authentication.getAuthToken().then(token => {
            console.log("Token received from Teams:", token);
            fetch(`/token?token=${token}`)
                .then(response => response.json())
                .then(data => {
                    console.log("Data received from backend:", data);
                    setData(data);
                })
                .catch(err => {
                    console.error("Error fetching data from backend:", err);
                    setError("Error fetching data: " + err.message);
                });
        }).catch(error => {
            console.error("Error getting token from Teams:", error);
            setError("Error getting token: " + error);
        });
    }, []);

    if (error) return <p>Error: {error}</p>;
    if (!data) return <p>Loading data...</p>;

    return (
        <div>
            <h1>Teams Tab with SSO</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

export default TeamsTabWithSSO;
