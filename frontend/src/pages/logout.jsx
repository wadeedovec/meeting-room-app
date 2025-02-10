import React, { useEffect } from 'react';
import { useUser } from "../../context/UserContext";

const Logout = () => {
    const { logout } = useUser(); // Must be inside the component

    useEffect(() => {
        localStorage.removeItem("accessToken");

        // Ensure `instance` is defined
        if (window.instance) {
            window.instance.logoutRedirect({
                postLogoutRedirectUri: "/login",
            });
        }

        logout();
    }, []); // Empty dependency array ensures this runs only on mount

    return (
        <div>Logging out...</div>
    );
};

export default Logout;
