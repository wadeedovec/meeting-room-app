import React, { createContext, useContext, useState } from 'react';
import { useMsal } from "@azure/msal-react";

const UserContext = createContext();
export const useUser = () => {
    return useContext(UserContext);
};
export const UserProvider = ({ children }) => {
    const { instance } = useMsal();
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const login = (user) => {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
    };
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        instance.logoutRedirect({
            postLogoutRedirectUri: "/login",
        });
    };
    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};
