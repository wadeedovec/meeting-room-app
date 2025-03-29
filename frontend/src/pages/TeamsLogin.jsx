import React, { useEffect, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';

function TeamsTabWithSSO() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function init() {
            try {
                await microsoftTeams.app.initialize(); // required before any Teams API
                const token = await microsoftTeams.authentication.getAuthToken({
                    resources: ["api://booking.dovecgroup.com/" + import.meta.env.VITE_CLIENT_ID + "/access_as_user"] // your exposed API scope
                });

                console.log("Token received from Teams:", token);

                const res = await fetch(`/token?token=${token}`);
                const data = await res.json();
                setData(data);
            } catch (err) {
                console.error("Error getting Teams auth token:", err);
                setError("Could not get SSO token: " + err.message);
            }
        }

        init();
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
