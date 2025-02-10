import React, { useState, useEffect } from 'react';

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch reservations on component mount
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/reservations');
                if (!response.ok) {
                    throw new Error('Failed to fetch reservations');
                }
                const data = await response.json();
                setReservations(data.data); // Assuming the API returns the data in "data" property
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReservations();
    }, []);

    if (loading) {
        return (
            <Box textAlign="center" p={4}>
                <Spinner size="xl" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box textAlign="center" p={4}>
                <Alert status="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box
            maxHeight="800px"
            overflowY="auto"
            padding="4"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="gray.50"
        >
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6px">
                {reservations.map((reservation) => (
                    <Card.Root key={reservation._id} bg="white" shadow="md" borderRadius="lg" overflow="hidden">
                        <Card.Header padding="4" bg="gray.50">
                            <Heading fontSize="lg">🏠 {reservation.meetingRoomId.name}</Heading>
                        </Card.Header>
                        <Card.Body padding="4">
                            <Heading fontSize="md">
                                {reservation.subject}
                            </Heading>
                            <Text fontWeight="medium" fontSize="sm" color="gray.500">
                                Start Time: {new Date(reservation.start).toLocaleString()}
                            </Text>
                            <Text fontWeight="medium" fontSize="sm" color="gray.500" mb="4">
                                End Time: {new Date(reservation.end).toLocaleString()}
                            </Text>
                            <Text fontWeight="medium" fontSize="sm" color="gray.600">
                                Reserved By: {reservation.organizer?.name}
                            </Text>
                        </Card.Body>
                    </Card.Root>
                ))}
            </SimpleGrid>
        </Box>
    );
};

export default Reservations;
