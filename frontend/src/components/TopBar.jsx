import React from 'react';
import { RiLogoutBoxLine } from "react-icons/ri";
import { FaGlobe } from "react-icons/fa"; // Globe icon for better UI
import Logo from '../assets/images/dovec beyaz.png';
import { useUser } from "../../context/UserContext";
import { useTranslation } from 'react-i18next';
import 'bootstrap/dist/css/bootstrap.min.css';

const Topbar = () => {
    const { user, logout } = useUser();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <nav className="navbar navbar-dark bg-primary p-3">
            <div className="container-xl d-flex align-items-center">
                {/* Logo */}
                <img src={Logo} alt="Logo" width={100} style={{ objectFit: 'contain' }} />

                {/* Language Selector (Dropdown) */}
                <div className='d-flex align-items-center ms-auto'>
                    <div className="dropdown me-3">
                        <button
                            className="btn btn-light dropdown-toggle d-flex align-items-center"
                            type="button"
                            id="languageDropdown"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <FaGlobe className="me-2" /> {t('language')}
                        </button>
                        <ul className="dropdown-menu" aria-labelledby="languageDropdown">
                            <li>
                                <button className="dropdown-item" onClick={() => handleLanguageChange('en')}>
                                    🇬🇧 English
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item" onClick={() => handleLanguageChange('tr')}>
                                    🇹🇷 Türkçe
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Logout Button */}
                    {user && (
                        <button className="btn btn-light d-flex align-items-center" onClick={handleLogout}>
                            <RiLogoutBoxLine className="me-2" /> {t('logout')}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Topbar;
