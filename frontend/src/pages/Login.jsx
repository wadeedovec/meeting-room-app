import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
const Login = () => {
    const { instance } = useMsal();
    const { login } = useUser();
    const [error, setError] = useState("");
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
                role: "user",
                roomAccess: null,
            };
            const checkUserResponse = await fetch("http://localhost:5000/api/users/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: account.username }),
            });
            const checkUserData = await checkUserResponse.json();
            if (!checkUserData.userExists || checkUserData.userExists == false) {
                const addUserResponse = await fetch("http://localhost:5000/api/users/add-user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData),
                });
                const addedUser = await addUserResponse.json();
                login(addedUser.user);
            } else {
                login(checkUserData.user);
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("Login failed. Please try again.");
        }
    };
    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow-lg text-center" style={{ width: "400px" }}>
                <h3 className="mb-4">Welcome</h3>
                <button className="btn btn-primary btn-lg w-100" onClick={handleLogin}>
                    Login via Microsoft Teams
                </button>
                {error && <div className="text-danger mt-3">{error}</div>}
            </div>
        </div>
    );
};
export default Login;
