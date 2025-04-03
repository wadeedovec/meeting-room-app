import React, { useEffect, useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import * as microsoftTeams from '@microsoft/teams-js';

const Login = () => {
    const { instance } = useMsal();
    const { login } = useUser();
    const { t, i18n } = useTranslation();
    const [error, setError] = useState("");
    const [userLoggedIn, setUserLoggedIn] = useState(localStorage.getItem("user") ? true : false);

    useEffect(() => {
        async function init() {
            if (!userLoggedIn) {
                try {
                    await microsoftTeams.app.initialize();
                    const token = await microsoftTeams.authentication.getAuthToken({
                        resources: ["api://booking.dovecgroup.com/" + import.meta.env.VITE_CLIENT_ID]
                    });

                    console.log("Token received from Teams:", token);

                    const response = await fetch(`${import.meta.env.VITE_API_URI}token?token=${token}`);
                    if (!response.ok) {
                        throw new Error(`HTTP status ${response.status}: ${await response.text()}`);
                    }
                    const data = await response.json();
                    const userData = {
                        name: data.displayName,
                        email: data.mail,
                        aad_id: data.id,
                        role: "user"
                    };
                    const checkUserResponse = await fetch(`${import.meta.env.VITE_API_URI}users/check-user`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                        },
                        body: JSON.stringify({ email: data.mail }),
                    });
                    const checkUserData = await checkUserResponse.json();
                    if (!checkUserData.userExists || checkUserData.userExists === false) {
                        const addUserResponse = await fetch(`${import.meta.env.VITE_API_URI}users/add-user`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                            },
                            body: JSON.stringify(userData),
                        });
                        const addedUser = await addUserResponse.json();
                        login(addedUser.user);
                    } else {
                        login(checkUserData.user);
                    }
                    setUserLoggedIn(true);
                } catch (err) {
                    console.error("Error getting Teams auth token:", err);
                    setError("Could not get SSO token: " + err.message);
                }
            }
        }

        init();
    }, [userLoggedIn]);
    if (localStorage.getItem("user")) {
        return <Navigate replace to="/" />;
    }
    const handleLogin = async () => {
        try {
            const response = await instance.loginPopup(loginRequest);
            const account = response.account;
            const userData = {
                name: account.name,
                email: account.username,
                aad_id: account.localAccountId,
                role: "user"
            };
            const checkUserResponse = await fetch(`${import.meta.env.VITE_API_URI}users/check-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                },
                body: JSON.stringify({ email: account.username }),
            });
            const checkUserData = await checkUserResponse.json();
            if (!checkUserData.userExists || checkUserData.userExists === false) {
                const addUserResponse = await fetch(`${import.meta.env.VITE_API_URI}users/add-user`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                    },
                    body: JSON.stringify(userData),
                });
                const addedUser = await addUserResponse.json();
                login(addedUser.user);
            } else {
                login(checkUserData.user);
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError(t("login_error"));
        }
    };
    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
    };
    return (
        <div className="vh-100 d-flex justify-content-center align-items-center login-bg">
            <div className="glass-card p-5 shadow-lg text-center">
                <h2 className="fw-bold">{t("welcome")}</h2>
                <p className="text-light">{t("login_subtext")}</p>
                {/* Language Selector */}
                <div className="dropdown mb-3">
                    <button className="btn btn-outline-light dropdown-toggle" type="button" id="languageDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <FaGlobe className="me-2" /> {t("language")}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark text-center">
                        <li><button className="dropdown-item" onClick={() => handleLanguageChange("en")}>🇬🇧 English</button></li>
                        <li><button className="dropdown-item" onClick={() => handleLanguageChange("tr")}>🇹🇷 Türkçe</button></li>
                    </ul>
                </div>
                <button className="btn btn-primary btn-lg w-100 rounded-pill" onClick={handleLogin}>
                    {t("login_button")}
                </button>
                {/* Error Message */}
                {error && <div className="text-danger mt-3 fw-bold">{error}</div>}
            </div>
        </div>
    );
};
export default Login;
