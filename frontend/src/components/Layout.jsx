import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Layout = ({ children }) => {
    const { user, loading } = useUser();
    const { roomId } = useParams();
    const [room, setRoom] = useState("");

    const fetchMeetingRoom = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`);
            if (!response.ok) {
                window.location.replace('/login');
            }
            const data = await response.json();
            setRoom(data.data);
        } catch (error) {
            console.error("Error fetching Room:", error);
        }
    };

    useEffect(() => {
        if (!user && roomId) {
            fetchMeetingRoom();
        }
    }, [user, roomId]);

    return (
        <div className="min-vh-100">
            <Topbar />
            <ToastContainer />
            <div className="container py-4">
                {/* Header Section */}
                <div className="row mb-4 align-items-center">
                    <div className="col-md-6">
                        <h5 className="fw-bold text-primary">
                            {loading
                                ? "Loading..."
                                : user
                                    ? `Hello ${user.name}, 👋`
                                    : `Welcome to ${room.name || "Guest"}'s Room`}
                        </h5>
                    </div>
                </div>
                {/* Content */}
                {children}
            </div>
        </div>
    );
};

export default Layout;
