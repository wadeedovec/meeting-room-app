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
                    resources: ["api://booking.dovecgroup.com/" + import.meta.env.VITE_CLIENT_ID] // your exposed API scope
                });

                // Display the token in the UI for debugging (if needed)
                // Remember to remove or protect sensitive information in production!
                setData({ token });

                const res = await fetch(`${import.meta.env.VITE_API_URI}token?token=${token}`);
                const jsonData = await res.json();
                setData(jsonData); // Update the data state with the fetched data
            } catch (err) {
                setError(`Could not get SSO token: ${err.message}`);
            }
        }

        init();
    }, []);

    if (error) return <p>Error: {error}</p>;
    if (!data) return <p>Loading data...</p>;

    return (
        <div>
            <h1>Teams Tab with SSO</h1>
            {/* Output data in a formatted way for debugging */}
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}

export default TeamsTabWithSSO;
