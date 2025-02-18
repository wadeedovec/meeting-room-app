import React, { useState, useEffect } from "react";
import { RiAddLine } from "react-icons/ri";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useMsal } from "@azure/msal-react";
import { useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { InteractionType } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const CalendarPage = () => {
    const { roomId } = useParams();
    const { instance, accounts } = useMsal();
    const account = accounts[0];
    const [events, setEvents] = useState([]);
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [formData, setFormData] = useState({
        organizer: "",
        subject: "",
        startTime: "",
        endTime: "",
    });
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (roomId && !formData.organizer) {
            newErrors.organizer = "Organizer is required.";
        }
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    let accessToken = null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) {
            if (errors.organizer) {
                toast.error(errors.organizer);
            } else if (errors.subject) {
                toast.error(errors.subject);
            } else if (errors.startTime) {
                toast.error(errors.startTime);
            } else if (errors.endTime) {
                toast.error(errors.endTime);
            } else if (errors.time) {
                toast.error(errors.time);
            }
            return;
        }
        if (!selectedRoom) {
            toast.error("Please select a meeting room.");
            return;
        }
        setIsSubmitting(true);
        const newStart = new Date(formData.startTime);
        const newEnd = new Date(formData.endTime);
        const now = new Date();
        if (newStart < now) {
            toast.error("You cannot make a reservation in the past.");
            setIsSubmitting(false);
            return;
        }
        if (newEnd <= newStart) {
            toast.error("End time must be after start time.");
            setIsSubmitting(false);
            return;
        }
        try {
            const reservationsResponse = await fetch(
                `${import.meta.env.VITE_API_URI}reservations/room/${selectedRoom}`
            );
            if (!reservationsResponse.ok) {
                toast.error("Failed to fetch existing reservations.");
                return;
            }
            const response = await reservationsResponse.json();
            const existingReservations = response.data;
            if (!Array.isArray(existingReservations)) {
                toast.error("Invalid response format for reservations.");
                return;
            }
            const hasConflict = existingReservations.some(reservation => {
                const existingStart = new Date(reservation.start);
                const existingEnd = new Date(reservation.end);
                return (newStart < existingEnd && newEnd > existingStart);
            });
            if (hasConflict) {
                toast.error("This time slot is already taken. Please select a different time.");
                return;
            }
            if (user) {
                const selectedRoomObject = rooms.find((room) => room._id === selectedRoom);
                const graphPayload = {
                    subject: formData.subject,
                    start: {
                        dateTime: formData.startTime,
                        timeZone: "Asia/Jerusalem",
                    },
                    end: {
                        dateTime: formData.endTime,
                        timeZone: "Asia/Jerusalem",
                    },
                    location: {
                        displayName: selectedRoomObject ? selectedRoomObject.name : "Unknown",
                    },
                    organizer: {
                        emailAddress: {
                            address: user.email,
                            name: user.name,
                        },
                    },
                };
                const graphClient = createGraphClient(account);
                await graphClient.api("https://graph.microsoft.com/v1.0/me/events").post(graphPayload);
            } else {
                console.log(formData);
                const tokenResponse = await fetch(`${import.meta.env.VITE_API_URI}getAccessToken`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (!tokenResponse.ok) {
                    throw new Error("Failed to get access token");
                }
                const tokenData = await tokenResponse.json();
                accessToken = tokenData.access_token;
                console.log("Access Token:", accessToken);
                const selectedUser = users.find((user) => user._id === formData.organizer);
                console.log("Selected User:", selectedUser.email);
                const selectedRoom = rooms.find((room) => room._id === roomId);
                const graphPayload = {
                    subject: formData.subject,
                    start: {
                        dateTime: formData.startTime,
                        timeZone: "Asia/Jerusalem",
                    },
                    end: {
                        dateTime: formData.endTime,
                        timeZone: "Asia/Jerusalem",
                    },
                    location: {
                        displayName: selectedRoom ? selectedRoom.name : "Unknown",
                    },
                    organizer: {
                        emailAddress: {
                            address: selectedUser.email,
                            name: selectedUser.name,
                        },
                    },
                };
                const headers = {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                };
                const response = await fetch(`https://graph.microsoft.com/v1.0/users/${selectedUser.email}/calendar/events`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(graphPayload),
                });

                if (response.ok) {
                    console.log("Event created successfully");
                } else {
                    const error = await response.json();
                    console.error("Error creating event:", error);
                }
            }
            const dbPayload = {
                subject: formData.subject,
                start: formData.startTime,
                end: formData.endTime,
                organizer: user ? user._id : formData.organizer,
                meetingRoomId: selectedRoom,
            };
            const dbResponse = await fetch(`${import.meta.env.VITE_API_URI}reservations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dbPayload),
            });
            if (dbResponse.ok) {
                setFormData({
                    subject: "",
                    startTime: "",
                    endTime: "",
                    meetingRoomId: null,
                });
                toast.success("Reservation created successfully!");
                fetchCalendars(selectedRoom);
                const modal = bootstrap.Modal.getInstance(document.getElementById("reservationModal"));
                modal.hide();
            } else {
                toast.error("Failed to save reservation in database.");
            }
        } catch (e) {
            console.error("Error:", e);
            toast.error("Failed to create reservation.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const fetchCalendars = async (roomId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}reservations/room/${roomId}`);
            if (!response.ok) {
                throw new Error("Room reservations");
            }
            const data = await response.json();
            const calendarEvents = data.data.map((event) => ({
                start: event.start,
                end: event.end,
                extendedProps: {
                    subject: event.subject || "No Subject",
                    organizer: event.organizer?.name || "Unknown",
                    location: event.meetingRoomId?.name || "Unknown",
                },
            }));
            setEvents(calendarEvents);
            console.log("room id", roomId);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    const fetchUsers = async () => {
        const controller = new AbortController();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}users/`, {
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const result = await response.json();
            if (result.success) {
                setUsers(result.data); // ✅ Extract 'data' array
            } else {
                console.error("Error: API returned success=false");
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error fetching rooms:", error);
            }
        }
        return () => controller.abort();
    };
    const fetchRooms = async () => {
        const controller = new AbortController();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}rooms/`, {
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error("Failed to fetch rooms");
            }
            const result = await response.json();
            if (result.success) {
                setRooms(result.data);
            } else {
                console.error("Error: API returned success=false");
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error fetching rooms:", error);
            }
        }
        return () => controller.abort();
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
    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        setSelectedRoom(roomId);
        fetchCalendars(roomId);
    };
    useEffect(() => {
        if (!user) {
            fetchUsers();
        } fetchRooms();
    }, []);
    useEffect(() => {
        if (!user) {
            setSelectedRoom(roomId);
            fetchCalendars(roomId);
        } else {
            if (rooms.length > 0) {
                const defaultRoom = rooms[0];
                setSelectedRoom(defaultRoom._id);
                fetchCalendars(defaultRoom._id);
            }
        }
    }, [rooms]);
    const getColorCircle = (color) => {
        const colorMap = {
            "green": "🟩",
            "blue": "🟦",
            "yellow": "🟨",
            "gold": "🟡",
            "orange": "🟧",
            "vip": "👑",
            "grey": "⬜"
        };

        return colorMap[color] || "";
    };
    return (
        <div>
            {/* Room Selection and Reservation Button */}
            <div className="row mb-4">
                {user && (
                    <div className="col-12 col-md-6 d-flex justify-content-center justify-content-md-start mb-3 mb-md-0">
                        <select
                            className="form-select form-select-md shadow-sm rounded-pill w-auto"
                            name="roomSelect"
                            value={selectedRoom}
                            onChange={handleRoomChange}
                        >
                            {rooms.length > 0 ? (
                                rooms.map((room) => (
                                    <option key={room._id} value={room._id}>
                                        {room.name} ({room.capacity}) {getColorCircle(room.room_color)}
                                    </option>
                                ))
                            ) : (
                                <option disabled>Loading rooms...</option>
                            )}
                        </select>
                    </div>
                )}
                <div className={user ? "col-12 col-md-6 text-md-end" : "col-12 col-md-12 text-md-end"}>
                    <button
                        className="btn btn-lg btn-success shadow-sm rounded-pill px-4 py-2"
                        data-bs-toggle="modal"
                        data-bs-target="#reservationModal"
                    >
                        <RiAddLine /> <span className="ms-2">New Reservation</span>
                    </button>
                </div>
            </div>
            {/* Calendar Section */}
            <div className="mt-4">
                <div className="card shadow-lg border-0 rounded-3">
                    <div className="card-body p-3">
                        <FullCalendar
                            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek",
                            }}
                            events={events}
                            eventContent={(arg) => {
                                const { extendedProps, start, end } = arg.event;
                                const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div
                                        style={{
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            maxWidth: '150px',
                                        }}
                                    >
                                        <em>{extendedProps.organizer}</em>
                                        {/* Time range with smaller text */}
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                color: '#fff',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap', /* Prevent wrapping */
                                                maxWidth: '100%',
                                            }}
                                        >
                                            <span>{startTime} - {endTime}</span>
                                        </div>
                                        {/* Organizer info with smaller font */}
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                color: '#fff',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            {/* Subject with truncation */}
                                            <h6
                                                style={{
                                                    fontSize: '10px',
                                                    margin: '0',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap', /* Prevent wrapping */
                                                    textOverflow: 'ellipsis', /* Truncate text */
                                                    maxWidth: '80px', /* Ensure it doesn't overflow container */
                                                }}
                                            >
                                                {extendedProps.subject}
                                            </h6>
                                        </div>
                                    </div>
                                );
                            }}
                            nowIndicator={true}
                            allDaySlot={false}
                            height="70vh"
                        />
                    </div>
                </div>
            </div>
            {/* Modal */}
            <div className="modal fade" id="reservationModal" tabIndex="-1" aria-labelledby="reservationModalLabel" aria-hidden="true" >
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="reservationModalLabel">New Reservation</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {!user && (
                                        <div className="col-12">
                                            <label className="form-label">Organizer <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-control ${errors.organizer ? "is-invalid" : ""}`}
                                                name="organizer"
                                                value={formData.organizer}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Organizer</option>
                                                {users.map((user) => (
                                                    <option key={user._id} value={user._id}>
                                                        {user.name} ({user.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.organizer && <div className="invalid-feedback">{errors.organizer}</div>}
                                        </div>
                                    )}
                                    {/* Meeting Subject */}
                                    <div className="col-12">
                                        <label className="form-label">Meeting Subject <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                                            placeholder="Enter meeting subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                        {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                                    </div>
                                    {/* Start Time */}
                                    <div className="col-md-6">
                                        <label className="form-label">Start Time <span className="text-danger">*</span></label>
                                        <input
                                            type="datetime-local"
                                            className={`form-control ${errors.startTime ? "is-invalid" : ""}`}
                                            name="startTime"
                                            value={formData.startTime}
                                            onChange={handleChange}
                                        />
                                        {errors.startTime && <div className="invalid-feedback">{errors.startTime}</div>}
                                    </div>
                                    {/* End Time */}
                                    <div className="col-md-6">
                                        <label className="form-label">End Time <span className="text-danger">*</span></label>
                                        <input
                                            type="datetime-local"
                                            className={`form-control ${errors.endTime ? "is-invalid" : ""}`}
                                            name="endTime"
                                            value={formData.endTime}
                                            onChange={handleChange}
                                        />
                                        {errors.endTime && <div className="invalid-feedback">{errors.endTime}</div>}
                                        {errors.time && <div className="invalid-feedback">{errors.time}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Reservation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CalendarPage;