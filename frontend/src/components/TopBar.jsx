import React from 'react';
import { RiLogoutBoxLine } from "react-icons/ri";
import Logo from '../assets/images/dovec beyaz.png';
import { useUser } from "../../context/UserContext";
import 'bootstrap/dist/css/bootstrap.min.css';

const Topbar = () => {
    const { user, logout } = useUser();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="navbar navbar-dark bg-primary p-3">
            <div className="container-xl d-flex align-items-center">
                <img src={Logo} alt="Logo" width={100} style={{ objectFit: 'contain' }} />
                {user && (
                    <button className="btn btn-light d-flex align-items-center" onClick={handleLogout}>
                        <RiLogoutBoxLine className="me-2" /> Log Out
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Topbar;
