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
    const [selectedRoom, setSelectedRoom] = useState("");
    const [formData, setFormData] = useState({
        organizer: "",
        subject: "",
        description: "",
        startTime: "",
        endTime: "",
    });
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (roomId) {
            if (!formData.organizer) {
                newErrors.organizer = "Organizer is required.";
            }
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
    const handleSubmitTablet = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill out the form correctly.");
            return;
        }
        console.log(formData.organizer);
        try {
            const dbPayload = {
                subject: formData.subject,
                start: formData.startTime,
                end: formData.endTime,
                organizer: formData.organizer,
                meetingRoomId: roomId,
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
                    organizer: "",
                    subject: "",
                    description: "",
                    startTime: "",
                    endTime: "",
                    meetingRoomId: null,
                });
                toast.success("Reservation created successfully!");
                fetchCalendars(selectedRoom);
                const modal = bootstrap.Modal.getInstance(document.getElementById("reservationModal"));
                modal.hide();
            } else {
                T
                toast.error("Failed to save reservation in database.");
            }
        } catch (error) {
            toast.error("Failed to create reservation.");
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill out the form correctly.");
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
                displayName: getRoomName(selectedRoom) || 'Unknown', // Use dynamic meeting room name
            },
            organizer: {
                emailAddress: {
                    address: user.email,
                    name: user.name,
                },
            },
        };
        try {
            const graphClient = createGraphClient(account);
            await graphClient.api("https://graph.microsoft.com/v1.0/me/events").post(graphPayload);
            const dbPayload = {
                subject: formData.subject,
                start: formData.startTime,
                end: formData.endTime,
                organizer: user._id,
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
                    description: "",
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
        } catch (error) {
            toast.error("Failed to create reservation.");
        }
    };
    const fetchCalendars = async (roomId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}reservations/room/${roomId}`);
            if (!response.ok) {
                window.location.replace('/');
            }
            const data = await response.json();
            const calendarEvents = data.data.map((event) => ({
                title: event.subject || "No Subject",
                start: event.start,
                end: event.end,
                extendedProps: {
                    organizer: event.organizer?.name || "Unknown",
                    location: event.meetingRoomId?.name || "Unknown",
                },
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Error fetching data:");
        }
    };
    const fetchMeetingRoom = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}rooms/${roomId}`);
            if (!response.ok) {
                window.location.replace('/login');
            }
            const data = await response.json();
        } catch (error) {
            console.error("Error fetching Room");
        }
    }
    const getRoomName = (roomId) => {
        const room = user.roomAccess.find((room) => room._id === roomId);
        return room ? room.name : "Unknown Room";
    };
    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        setSelectedRoom(roomId);
        fetchCalendars(roomId);
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
    const fetchUserAccessed = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}users/room/${roomId}`);
            if (!response.ok) {
                throw new Error('no user');
            }
            const data = await response.json();
            setUsers(data.data);
        } catch (error) {
            console.error("Error fetching Room", error);
        }
    }
    useEffect(() => {
        if (user) {
            if (user?.roomAccess?.length > 0) {
                const defaultRoom = user.roomAccess[0]._id;
                setSelectedRoom(defaultRoom);
                fetchCalendars(defaultRoom);
            }
            if (roomId) {
                window.location.replace('/');
            }
        } else {
            fetchUserAccessed();
            fetchMeetingRoom();
            setSelectedRoom(roomId);
            fetchCalendars(roomId);
        }
    }, [user?.roomAccess]);
    if (user && user?.roomAccess?.length > 0 && !roomId) {
        return (
            <div>
                {/* Room Selection and Reservation Button */}
                <div className="row mb-4">
                    <div className="col-12 col-md-6 d-flex justify-content-center justify-content-md-start mb-3 mb-md-0">
                        <select
                            className="form-select form-select-md shadow-sm rounded-pill w-auto"
                            name="roomSelect"
                            value={selectedRoom}
                            onChange={handleRoomChange}
                        >
                            {user.roomAccess.map((room) => (
                                <option key={room._id} value={room._id}>{room.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-6 text-md-end">
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
                                        {/* Meeting Description */}
                                        <div className="col-12">
                                            <label className="form-label">Meeting Description</label>
                                            <textarea
                                                className="form-control"
                                                placeholder="Enter meeting description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                            ></textarea>
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
                                    <button type="submit" className="btn btn-primary">Save Reservation</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    } if (roomId && !user) {
        return (
            <div>
                <div className="row mb-4">
                    <div className="col-12 col-md-12 text-md-end">
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
                            <form onSubmit={handleSubmitTablet}>
                                <div className="modal-header">
                                    <h5 className="modal-title" id="reservationModalLabel">New Reservation</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        {/* Organizer Selection (Searchable) */}
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
                                        {/* Meeting Description */}
                                        <div className="col-12">
                                            <label className="form-label">Meeting Description</label>
                                            <textarea
                                                className="form-control"
                                                placeholder="Enter meeting description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                            ></textarea>
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
                                    <button type="submit" className="btn btn-primary">Save Reservation</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (user && user?.roomAccess?.length == 0) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center">
                <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "500px", borderRadius: "20px" }}>
                    <div style={{ fontSize: "50px", marginBottom: "15px" }}>🔑</div>
                    <h2 className="mb-3 fw-bold">Access Pending</h2>
                    <p className="text-muted">An admin will grant you access to your rooms soon. Please wait for approval.</p>
                </div>
            </div>
        );
    }
};
export default CalendarPage;