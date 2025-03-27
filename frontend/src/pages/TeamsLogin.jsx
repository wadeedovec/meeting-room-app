import React, { useEffect, useState } from 'react';
import { app } from '@microsoft/teams-js';

function TeamsLogin() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        app.initialize();

        app.getContext((context) => {
            app.authentication.getAuthToken({
                successCallback: async (access_token) => {
                    try {
                        const res = await fetch('http://localhost:5000/api/getAccessToken', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': import.meta.env.VITE_INTERNAL_API_KEY,
                            },
                            body: JSON.stringify({ access_token }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                            setUser(data);
                        } else {
                            setError(data.error || 'Authentication failed');
                        }
                    } catch (err) {
                        console.error('Server error:', err);
                        setError('Something went wrong');
                    }
                },
                failureCallback: (err) => {
                    console.error('Auth token error:', err);
                    setError('Failed to get Microsoft Teams auth token');
                },
                resources: []
            });
        });

    }, []);

    if (error) return <p>Error: {error}</p>;
    if (!user) return <p>Authenticating with Microsoft Teams...</p>;
    return (
        <div>
            <h2>Welcome, {user.name}</h2>
            <p>Email: {user.email}</p>
        </div>
    );
}

export default TeamsLogin;
