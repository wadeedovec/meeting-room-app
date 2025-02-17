import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

const AuthRedirectHandler = () => {
    const { instance } = useMsal();

    useEffect(() => {
        instance
            .handleRedirectPromise()
            .then((response) => {
                if (response) {
                    console.log("Authenticated with response", response);
                    // Handle successful authentication (save user, navigate, etc.)
                }
            })
            .catch((error) => {
                console.error("Redirect Error:", error);
            });
    }, [instance]);

    return <div>Loading...</div>;  // Optional loading state
};

export default AuthRedirectHandler;
