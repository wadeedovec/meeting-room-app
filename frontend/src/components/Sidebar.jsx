import React, { useContext } from 'react';
import { RiAddLine, RiHomeSmileLine, RiArmchairLine, RiLogoutBoxLine } from "react-icons/ri";
import logo from '../assets/images/dovec-logo.png';
import { Link } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { useUser } from "../../context/UserContext";

const Sidebar = () => {
    const { instance } = useMsal();
    const { logout } = useUser();

    const handleLogout = () => {
        // Clear user data from localStorage
        localStorage.removeItem("accessToken");

        logout();

        // Perform logout and redirect
        instance.logoutRedirect({
            postLogoutRedirectUri: "/login",
        });
    };

    return (
        <Box
            as="aside"
            width="250px"
            height="100vh"
            bg="gray.50"
            color="black"
            padding="12"
        >
            <Flex direction="column" align="start" height="100%">
                <Box marginBottom="12" display="flex" justifyContent="center" width="100%">
                    <Image src={logo} width={150} />
                </Box>
                <Stack align="center" width="100%">
                    <Link to={"/rooms"}>
                        <Button variant="outline" size="md">
                            <RiAddLine />
                            New Reservation
                        </Button>
                    </Link>
                    <Stack spacing="4" width="100%">
                        <Link to={"/"} style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            className="sidebar-link">
                            <RiHomeSmileLine size={20} />
                            <Text fontSize="lg" fontWeight="medium" color="gray.700">
                                Home
                            </Text>
                        </Link>
                        <Link to={"/reservations"} style={{ display: "flex", alignItems: "center", gap: "8px" }} className="sidebar-link">
                            <RiArmchairLine size={20} />
                            <Text fontSize="lg" fontWeight="medium" color="gray.700">
                                Reservations
                            </Text>
                        </Link>
                    </Stack>
                </Stack>
                <Box marginTop="auto" paddingTop="6" borderTop="1px solid gray" textAlign="center">
                    <Button
                        onClick={handleLogout}
                        leftIcon={<RiLogoutBoxLine />}
                        colorScheme="red"
                        variant="solid"
                        size="md"
                        width="100%"
                    >
                        Logout
                    </Button>
                    <Text fontSize="xl" color="gray.500" mt={4}>
                        © 2025 Meeting Room App
                    </Text>
                </Box>
            </Flex>
        </Box>
    );
};

export default Sidebar;
