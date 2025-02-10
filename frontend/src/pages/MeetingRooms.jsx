import React, { useState, useEffect } from "react";
import { CheckCircle, Building } from "lucide-react";
import { NavLink } from "react-router-dom";
const MeetingRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/rooms");
                if (!response.ok) {
                    throw new Error("Failed to fetch rooms");
                }
                const data = await response.json();
                setRooms(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);
    console.log(rooms);
    return (
        <Box p="6" minHeight="100vh">
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                Select a Meeting Room
            </Heading>
            {loading && (
                <Box textAlign="center">
                    <Spinner size="xl" />
                </Box>
            )}
            {error && (
                <Alert status="error" mb={4}>
                    <Alert.Indicator />
                    {error}
                </Alert>
            )}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={6}>
                {rooms.map((room) => (
                    <NavLink to={`/${room._id}/new-reservation`} >
                        <Box
                            key={room._id}
                            p={5}
                            borderWidth={1}
                            borderRadius="lg"
                            boxShadow="md"
                            bg="white"
                            cursor="pointer"
                            transition="0.3s ease"
                            _hover={{ boxShadow: "lg" }}
                        >
                            <VStack spacing={3}>
                                <Building size={40} color="#2b6cb0" />
                                <Text fontSize="xl" fontWeight="bold">{room.name}</Text>
                                <Text fontSize="md">Capacity: {room.capacity} people</Text>
                                <Button
                                    colorScheme="blue"
                                    size="sm"
                                >
                                    Select Room
                                </Button>
                            </VStack>
                        </Box>
                    </NavLink>
                ))}
            </Grid>
        </Box>
    );
};
export default MeetingRooms;
