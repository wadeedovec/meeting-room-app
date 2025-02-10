import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';

import { InteractionType } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { useMsal } from "@azure/msal-react";
import { useUser } from "../../context/UserContext";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";

const NewReservation = () => {
    const { user } = useUser();
    const { meetingRoomId } = useParams();
    const { instance, accounts } = useMsal();
    const account = accounts[0];

    const [meetingRoomName, setMeetingRoomName] = useState('');
    const [formData, setFormData] = useState({
        subject: "",
        description: "",
        startTime: "",
        endTime: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchMeetingRoom = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/rooms/${meetingRoomId}`);
                const data = await response.json();
                if (data && data.data.name) {
                    setMeetingRoomName(data.data.name);
                } else {
                    setMeetingRoomName('Unknown Room');
                }
            } catch (error) {
                console.error("Error fetching meeting room:", error);
                setMeetingRoomName('Unknown Room');
            }
        };
        fetchMeetingRoom();
    }, [meetingRoomId]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.subject.trim()) {
            newErrors.subject = "Meeting subject is required.";
        }
        if (!formData.startTime) {
            newErrors.startTime = "Start time is required.";
        }
        if (!formData.endTime) {
            newErrors.endTime = "End time is required.";
        }
        if (formData.startTime && formData.endTime) {
            const startTime = new Date(formData.startTime);
            const endTime = new Date(formData.endTime);
            if (startTime >= endTime) {
                newErrors.time = "Start time must be before end time.";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toaster.create({
                description: "Please correct the errors and try again.",
                type: "error",
            });
            return;
        }

        const graphPayload = {
            subject: formData.subject,
            body: {
                contentType: "HTML",
                content: formData.description,
            },
            start: {
                dateTime: formData.startTime,
                timeZone: "Asia/Jerusalem",
            },
            end: {
                dateTime: formData.endTime,
                timeZone: "Asia/Jerusalem",
            },
            location: {
                displayName: meetingRoomName || 'Unknown', // Use dynamic meeting room name
            },
            organizer: {
                emailAddress: {
                    address: account.username,
                    name: account.name,
                },
            },
        };

        toaster.create({
            description: "Processing your reservation...",
            type: "info",
        });

        try {
            const graphClient = createGraphClient(account);
            await graphClient.api("https://graph.microsoft.com/v1.0/me/events").post(graphPayload);

            const dbPayload = {
                subject: formData.subject,
                start: formData.startTime,
                end: formData.endTime,
                organizer: userId,
                meetingRoomId: meetingRoomId,
            };

            const dbResponse = await fetch("http://localhost:5000/api/reservations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dbPayload),
            });

            if (dbResponse.ok) {
                toaster.create({
                    description: "Reservation saved successfully.",
                    type: "success",
                });
                setFormData({
                    subject: "",
                    description: "",
                    startTime: "",
                    endTime: "",
                });
            } else {
                toaster.create({
                    description: "Failed to save reservation in the database.",
                    type: "error",
                });
            }
        } catch (error) {
            toaster.create({
                description: `Error: ${error.message}`,
                type: "error",
            });
        }
    };

    const createGraphClient = (account) => {
        const authProviderOptions = {
            account,
            interactionType: InteractionType.Popup,
            scopes: [
                "user.read",
                "Calendars.Read",
                "Calendars.Read.Shared",
                "Calendars.ReadWrite",
                "Team.ReadBasic.All",
                "User.Read.All",
                "Directory.Read.All",
            ],
        };
        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
            instance,
            authProviderOptions
        );
        return Client.initWithMiddleware({ authProvider });
    };

    return (
        <Box p="6" minHeight="100vh">
            <Toaster />
            <Box maxW="500px" mx="auto" mt="10" p="6" bg="white" borderRadius="lg" boxShadow="md">
                <Heading as="h2" size="lg" mb="6" textAlign="center">
                    Create a New Reservation
                </Heading>
                <form onSubmit={handleSubmit}>
                    <VStack spacing="4">
                        {/* Meeting Subject */}
                        <Field label="Meeting Subject">
                            <Input
                                type="text"
                                placeholder="Enter meeting subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                            />
                            {errors.subject && (
                                <Text color="red.500" fontSize="sm">
                                    {errors.subject}
                                </Text>
                            )}
                        </Field>
                        {/* Meeting Description */}
                        <Field label="Meeting Description">
                            <Textarea
                                placeholder="Enter meeting description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Field>
                        {/* Start Time */}
                        <Field label="Start Time">
                            <Input
                                type="datetime-local"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                            />
                            {errors.startTime && (
                                <Text color="red.500" fontSize="sm">
                                    {errors.startTime}
                                </Text>
                            )}
                        </Field>
                        {/* End Time */}
                        <Field label="End Time">
                            <Input
                                type="datetime-local"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                            />
                            {errors.endTime && (
                                <Text color="red.500" fontSize="sm">
                                    {errors.endTime}
                                </Text>
                            )}
                            {errors.time && (
                                <Text color="red.500" fontSize="sm">
                                    {errors.time}
                                </Text>
                            )}
                        </Field>
                        {/* Submit Button */}
                        <Button type="submit" colorScheme="blue" width="full">
                            Create Reservation
                        </Button>
                    </VStack>
                </form>
            </Box>
        </Box>
    );
};

export default NewReservation;
