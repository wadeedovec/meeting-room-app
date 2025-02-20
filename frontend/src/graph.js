//import { graphConfig } from "./authConfig";
/**
 * Attaches a given access token to a MS Graph API call. Returns information about the user
 * @param accessToken 
 */
export async function callMsGraph(accessToken, endpoint, method = "GET", body = null) {
    if (!accessToken) {
        throw new Error("Access token is missing.");
    }

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);
    headers.append("Content-Type", "application/json");

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            const errorDetails = await response.text();
            console.error("Error response:", response.status, errorDetails);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Graph API call error:", error);
        throw error;
    }
}
