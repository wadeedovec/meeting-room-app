import React, { useState, useEffect } from 'react';

// Declare accessToken and expiresAt outside the fetchEvents function
let accessToken = null;
let expiresAt = null;

// Helper function to fetch events
const fetchEvents = async () => {
    const getAccessToken = async () => {
        const now = new Date().getTime();
        // Check if token is still valid
        if (accessToken && expiresAt && now < expiresAt) {
            return accessToken;
        }
        
        const apiKey = import.meta.env.VITE_INTERNAL_API_KEY;
        const tokenResponse = await fetch(`${import.meta.env.VITE_API_URI}getAccessToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
        });
        
        if (!tokenResponse.ok) {
            throw new Error("Failed to get access token");
        }
        
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
        expiresAt = new Date().getTime() + (tokenData.expires_in * 1000);
        return accessToken;
    };

    const token = await getAccessToken();
    const response = await fetch('https://graph.microsoft.com/v1.0/wadee.aburayya@dovecgroup.com/events', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    return data.value; // Assuming "value" contains the list of events
};

const GetEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const eventData = await fetchEvents();
                setEvents(eventData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, []);

    if (loading) {
        return <div>Loading events...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Event List</h2>
            <ul>
                {events.map(event => (
                    <li key={event.id}>
                        {event.subject} - {event.start.dateTime}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GetEvents;
