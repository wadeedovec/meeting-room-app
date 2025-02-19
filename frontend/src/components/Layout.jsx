import React from "react";
import Topbar from "../components/TopBar.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Layout = ({ children }) => {
    return (
        <div className="min-vh-100">
            <Topbar />
            <ToastContainer />
            <div className="container py-4">
                {children}
            </div>
        </div>
    );
};
export default Layout;
