import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChartLine, FaBell } from 'react-icons/fa';

const DashboardPage = () => {
    return (
        <Box p="6">
            {/* Top Section - Summary Cards */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>

                {/* Today's Reservations */}
                <Box bg="white" p="6" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.200">
                    <Flex align="center" gap="2">
                        <Icon as={FaCalendarAlt} boxSize="5" color="blue.500" />
                        <Text fontSize="lg" fontWeight="semibold">Today’s Bookings</Text>
                    </Flex>
                    <Text color="gray.500">9:00 AM - 5:00 PM</Text>
                    <Button mt="4" colorScheme="blue" size="sm">View Schedule</Button>
                </Box>

                {/* Announcements */}
                <Box bg="white" p="6" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.200">
                    <Flex align="center" gap="2">
                        <Icon as={FaBell} boxSize="5" color="red.500" />
                        <Text fontSize="lg" fontWeight="semibold">Announcements</Text>
                    </Flex>
                    <Text color="gray.500" mt="2">No new announcements</Text>
                </Box>

                {/* Insights */}
                <Box bg="white" p="6" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.200">
                    <Flex align="center" gap="2">
                        <Icon as={FaChartLine} boxSize="5" color="green.500" />
                        <Text fontSize="lg" fontWeight="semibold">Insights</Text>
                    </Flex>
                    <Stack mt="4" spacing="2">
                        <Text>21 Tue: 2 bookings</Text>
                        <Text>22 Wed: 3 bookings</Text>
                        <Text>23 Thu: 1 booking</Text>
                    </Stack>
                </Box>

            </Grid>

            

        </Box>
    );
};

export default DashboardPage;
