import React, { useState, useEffect } from "react";
import { RiAddLine } from "react-icons/ri";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import allLocales from '@fullcalendar/core/locales-all'
import { useParams } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { useTranslation } from 'react-i18next';
const CalendarPage = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;
    const { roomId } = useParams();
    const [events, setEvents] = useState([]);
    const { user } = useUser();
    const [MsUsers, setMsUsers] = useState([]);
    const { loading } = useUser();
    const [room, setRoom] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    let accessToken = null;
    let expiresAt = null;
    const options = MsUsers.map(user => ({
        value: user.id,
        email: user.mail,
        label: user.displayName
    }));
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
    const [rooms, setRooms] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const handleEventClick = (event) => {
        const eventStartUTC = new Date(event.start).toISOString().slice(0, 16);
        const eventEndUTC = new Date(event.end).toISOString().slice(0, 16);
        const selected = {
            id: event.id,
            msId: event.extendedProps.mSid,
            organizer: event.extendedProps.organizer,
            subject: event.extendedProps.subject,
            startTime: eventStartUTC,
            endTime: eventEndUTC
        };
        setSelectedEvent(selected);
        setFormData({
            subject: event.extendedProps.subject,
            startTime: eventStartUTC,
            endTime: eventEndUTC,
        });
        const modal = new bootstrap.Modal(document.getElementById("reservationModal"));
        modal.show();
    };
    const resetEventData = () => {
        setSelectedEvent(null);
        setFormData({
            organizer: "",
            attendees: [],
            subject: "",
            startTime: "",
            endTime: "",
        });
    };
    const [formData, setFormData] = useState({
        organizer: "",
        attendees: [],
        subject: selectedEvent?.subject || "",
        startTime: selectedEvent?.startTime || "",
        endTime: selectedEvent?.endTime || "",
    });
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    };
    const handleAttendeesChange = (selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map(option => option.email) : [];
        setFormData(prevFormData => ({
            ...prevFormData,
            attendees: values
        }));
        setErrors(prevErrors => ({
            ...prevErrors,
            attendees: ""
        }));
    };
    const validateForm = () => {
        let newStartUTC = null;
        let newEndUTC = null;
        if (formData.startTime) {
            newStartUTC = new Date(`${formData.startTime}:00.000Z`);
        }
        if (formData.endTime) {
            newEndUTC = new Date(`${formData.endTime}:00.000Z`);
        }
        const newErrors = {};
        if (roomId && !formData.organizer) {
            newErrors.organizer = t('errors.organizerRequired');
        }
        if (!formData.subject.trim()) {
            newErrors.subject = t('errors.subjectRequired');
        }
        if (!newStartUTC) {
            newErrors.startTime = t('errors.startTimeRequired');
        }
        if (!newEndUTC) {
            newErrors.endTime = t('errors.endTimeRequired');
        }
        if (newStartUTC && newEndUTC) {
            if (newStartUTC >= newEndUTC) {
                newErrors.time = t('errors.startTimeBeforeEndTime');
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const now = new Date().toISOString();
        let newStartUTC = null;
        let newEndUTC = null;
        if (formData.startTime) {
            newStartUTC = new Date(`${formData.startTime}:00.000Z`).toISOString();
        }
        if (formData.endTime) {
            newEndUTC = new Date(`${formData.endTime}:00.000Z`).toISOString();
        }
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
            toast.error(t('errors.meetingRoomRequired'));
            return;
        }
        setIsSubmitting(true);
        if (newStartUTC < now) {
            toast.error(t('errors.pastDate'));
            setIsSubmitting(false);
            return;
        }
        if (newEndUTC <= newStartUTC) {
            toast.error(t('errors.endTimeBeforeStartTime'));
            setIsSubmitting(false);
            return;
        }
        console.log(formData.attendees);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}reservations/room/${selectedRoom}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch reservations");
            }
            const data = await response.json();
            const events = data.data;
            const listedEvents = events.filter(reservation => reservation.isListed);
            const hasConflict = listedEvents.some(reservation => {
                const existingStart = new Date(reservation.start).toISOString();
                const existingEnd = new Date(reservation.end).toISOString();
                // Skip the selected event to avoid conflict with itself
                if (selectedEvent && reservation._id === selectedEvent.id) {
                    return false;
                }
                const newStartUTCconflict = new Date(`${formData.startTime}:00.000Z`).toISOString();
                const newEndUTCconflict = new Date(`${formData.endTime}:00.000Z`).toISOString();
                // Return true if there is a conflict
                return newStartUTCconflict < existingEnd && newEndUTCconflict > existingStart;
            });
            if (hasConflict) {
                toast.error(t('errors.reservationConflict'));
                return;
            }
            const selectedUser = user ? user : MsUsers.find((user) => user.id === formData.organizer);
            const accessToken = await getAccessToken();
            const selectedRoomInfo = user ? rooms.find((room) => room._id === selectedRoom) : rooms.find((room) => room._id === roomId);
            if (!selectedUser) {
                toast.error(t('errors.organizerNotFound'));
                return;
            }
            const graphPayload = {
                subject: formData.subject,
                start: {
                    dateTime: new Date(formData.startTime).toISOString(),
                    timeZone: "Europe/Athens",
                },
                end: {
                    dateTime: new Date(formData.endTime).toISOString(),
                    timeZone: "Europe/Athens",
                },
                location: {
                    displayName: selectedRoomInfo ? selectedRoomInfo.name[locale] : t('errors.unknown'),
                },
                organizer: {
                    emailAddress: {
                        address: user ? selectedUser.email : selectedUser.mail,
                        name: user ? selectedUser.name : selectedUser.displayName,
                    },
                },
            };
            if (formData.attendees && formData.attendees.length > 0) {
                graphPayload.attendees = formData.attendees.map(email => ({
                    emailAddress: {
                        address: email
                    }
                }));
            }
            const headers = {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            };
            if (selectedEvent) {
                const response = await fetch(`https://graph.microsoft.com/v1.0/users/${user ? selectedUser.email : selectedUser.mail}/calendar/events/${selectedEvent.msId}`, {
                    method: "PATCH",
                    headers: headers,
                    body: JSON.stringify(graphPayload),
                });
                if (response.ok) {
                    console.log("Event updated successfully");
                } else {
                    const error = await response.json();
                    console.error("Error updating event:", error);
                }
                const newStartUTC = new Date(`${formData.startTime}:00.000Z`).toISOString();
                const newEndUTC = new Date(`${formData.endTime}:00.000Z`).toISOString();
                const dbPayload = {
                    subject: formData.subject,
                    start: newStartUTC,
                    end: newEndUTC,
                    organizer: user ? selectedUser.email : selectedUser.mail,
                    meetingRoomId: selectedRoom,
                    isListed: true,
                    eventId: selectedEvent.msId,
                };
                if (formData.attendees && formData.attendees.length > 0) {
                    dbPayload.attendees = formData.attendees.map(email => ({
                        emailAddress: {
                            address: email
                        }
                    }));
                }
                const dbResponse = await fetch(`${import.meta.env.VITE_API_URI}reservations/${selectedEvent.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                    },
                    body: JSON.stringify(dbPayload),
                });
                if (!dbResponse.ok) {
                    throw new Error("Failed to update reservation");
                } else {
                    setFormData({
                        subject: "",
                        startTime: "",
                        endTime: "",
                        meetingRoomId: null,
                    });
                    toast.success(t('success.reservationUpdated'));
                    fetchReservations(selectedRoom);
                    const modal = bootstrap.Modal.getInstance(document.getElementById("reservationModal"));
                    modal.hide();
                }
            } else {
                const response = await fetch(`https://graph.microsoft.com/v1.0/users/${user ? selectedUser.email : selectedUser.mail}/calendar/events`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(graphPayload),
                });
                if (response.ok) {
                    const createdEvent = await response.json();
                    const newStartUTC = new Date(`${formData.startTime}:00.000Z`).toISOString();
                    const newEndUTC = new Date(`${formData.endTime}:00.000Z`).toISOString();
                    const dbPayload = {
                        subject: formData.subject,
                        start: newStartUTC,
                        end: newEndUTC,
                        organizer: user ? selectedUser.email : selectedUser.mail,
                        meetingRoomId: selectedRoom,
                        isListed: true,
                        eventId: createdEvent.id,
                    };
                    if (formData.attendees && formData.attendees.length > 0) {
                        dbPayload.attendees = formData.attendees.map(email => ({
                            emailAddress: {
                                address: email
                            }
                        }));
                    }
                    const dbResponse = await fetch(`${import.meta.env.VITE_API_URI}reservations`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                        },
                        body: JSON.stringify(dbPayload),
                    });
                    if (!dbResponse.ok) {
                        const dbError = await dbResponse.json();
                        toast.error(t('errors.failedToCreateReservationInDB'));
                        console.error("Database Error:", dbError);
                        return;
                    }
                    setFormData({
                        subject: "",
                        startTime: "",
                        endTime: "",
                        meetingRoomId: null,
                    });
                    toast.success(t('success.reservationCreated'));
                    fetchReservations(selectedRoom);
                    const modal = bootstrap.Modal.getInstance(document.getElementById("reservationModal"));
                    modal.hide();
                } else {
                    const error = await response.json();
                    toast.error(t('errors.failedToCreateEventInCalendar'));
                    console.error("Error creating event:", error);
                }
            }
        } catch (e) {
            console.error("Error:", e);
            toast.error(t('errors.failedToCreateReservation'));
        } finally {
            setIsSubmitting(false);
        }
    };
    const [eventToDelete, setEventToDelete] = useState(null);
    const handleDeleteClick = (event) => {
        setEventToDelete(event);
    };
    const handleConfirmDelete = async () => {
        if (eventToDelete) {
            await deleteEvent(eventToDelete);
            const modal = bootstrap.Modal.getInstance(document.getElementById("confirmationModal"));
            modal.hide();
            const reservationModal = bootstrap.Modal.getInstance(document.getElementById("reservationModal"));
            reservationModal.hide();
        }
    };
    const deleteEvent = async (event) => {
        try {
            const dbResponse = await fetch(`${import.meta.env.VITE_API_URI}reservations/${event.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                },
                body: JSON.stringify({ isListed: false }),
            });
            const accessToken = await getAccessToken();
            const headers = {
                "Authorization": `Bearer ${accessToken}`,
            };
            const mSresponse = await fetch(`https://graph.microsoft.com/v1.0/users/${user.email}/calendar/events/${event.msId}`, {
                method: "DELETE",
                headers: headers,
            });
            if (mSresponse.ok) {
                console.log("Event deleted successfully");
            } else {
                const error = await mSresponse.json();
                console.error("Error deleting event:", error);
            }
            if (!dbResponse.ok) {
                const dbError = await dbResponse.json();
                toast.error(t('errors.failedToDeleteReservation'));
                console.error("Database Error:", dbError);
                return;
            } else {
                toast.success(t('success.reservationDeleted'));
                fetchReservations(selectedRoom);
            }
        } catch (error) {
            toast.error(t('errors.failedToDeleteReservation'));
            console.error("Error deleting reservation:", error);
        }
    };
    const fetchReservations = async (roomId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}reservations/room/${roomId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                },
            });
            if (!response.ok) {
                throw new Error("Room reservations");
            }
            const data = await response.json();
            const listedReservations = data.data.filter(event => event.isListed === true);
            if (MsUsers.length === 0) {
                console.log("MsUsers is empty, retrying...");
                return;
            }
            const getDisplayName = (user) => {
                const msUser = MsUsers.find((u) => u.mail === user.organizer);
                return msUser ? msUser.displayName : t('errors.unknown');
            };
            const calendarEvents = listedReservations.map((event) => ({
                id: event._id,
                mSid: event.eventId,
                start: event.start,
                end: event.end,
                extendedProps: {
                    subject: event.subject || "No Subject",
                    organizer: getDisplayName(event),
                    location: event.meetingRoomId?.name || t('errors.unknown'),
                },
            }));
            setEvents(calendarEvents);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    const getAccessToken = async () => {
        const now = new Date().getTime();
        if (accessToken && expiresAt && now < expiresAt) {
            return accessToken;
        }
        const tokenResponse = await fetch(`${import.meta.env.VITE_API_URI}getAccessToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
            },
        });
        if (!tokenResponse.ok) {
            throw new Error("Failed to get access token");
        }
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
        expiresAt = new Date().getTime() + (tokenData.expires_in * 1000);
        return accessToken;
    };
    const FetchMsUsers = async () => {
        const accessToken = await getAccessToken();
        const headers = { "Authorization": `Bearer ${accessToken}` };
        const response = await fetch("https://graph.microsoft.com/v1.0/users?$top=999", { headers });
        if (!response.ok) {
            throw new Error("Failed to fetch users from Microsoft Graph");
        }
        const data = await response.json();
        setMsUsers(data.value);
    };
    const fetchRooms = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}rooms/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                },
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
            console.error("Error fetching rooms:", error);
        }
    };
    const fetchMeetingRoom = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}rooms/${roomId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_INTERNAL_API_KEY,
                },
            });
            if (!response.ok) {
                window.location.replace('/login');
            }
            const data = await response.json();
            setRoom(data.data);
        } catch (error) {
            console.error("Error fetching Room:", error);
        }
    };
    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        setSelectedRoom(roomId);
        fetchReservations(roomId);
    };
    const getRoomNameTranslation = (room) => {
        if (!room || !room.name) {
            console.warn("getRoomNameTranslation: room is undefined or has no name", room);
            return "Unknown Room";
        }
        return room.name[locale] || room.name.tr || "Unnamed Room";
    };
    useEffect(() => {
        if (!user) {
            fetchMeetingRoom();
            setSelectedRoom(roomId);
        }
        fetchRooms();
    }, [user]);
    useEffect(() => {
        FetchMsUsers();
    }, []);
    useEffect(() => {
        if (selectedRoom && MsUsers.length > 0) {
            fetchReservations(selectedRoom);
        }
    }, [selectedRoom, MsUsers]);
    useEffect(() => {
        if (!user) return;
        if (roomId) {
            setSelectedRoom(roomId);
        } else if (rooms.length > 0) {
            const defaultRoom = rooms[0];
            setSelectedRoom(defaultRoom._id);
        }
    }, [rooms, user, roomId]);
    useEffect(() => {
        // Select the modal element
        const modalElement = document.getElementById("reservationModal");
        // Add event listener to reset data when the modal is closed
        const handleModalClose = () => {
            resetEventData();  // Call the reset function when the modal is closed
        };
        if (modalElement) {
            // Listen for the Bootstrap modal close event
            modalElement.addEventListener("hidden.bs.modal", handleModalClose);
            // Clean up the event listener when the component is unmounted
            return () => {
                modalElement.removeEventListener("hidden.bs.modal", handleModalClose);
            };
        }
    }, []);
    return (
        <div>
            {user && (
                <div className="row mb-4 align-items-center">
                    <div className="col-md-6">
                        <h5 className="fw-bold text-primary">
                            {loading
                                ? t('loading')
                                : user
                                    ? `${t('hello')} ${user.name} 👋,`
                                    : t('guest')}
                        </h5>
                    </div>
                </div>
            )}
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
                                        {getRoomNameTranslation(room)} ({room.capacity}) {getColorCircle(room.room_color)}
                                    </option>
                                ))
                            ) : (
                                <option disabled>{t('loading')}</option>
                            )}
                        </select>
                    </div>
                )}
                {!user && (
                    <div className="col-md-6 mt-3">
                        <h4 className="fw-bold text-primary">
                            {loading
                                ? "Loading..."
                                : user
                                    ? `${t('hello')} ${user.name}, 👋`
                                    : `${getRoomNameTranslation(room) + getColorCircle(room.room_color) || t('errors.unknown')}}`}
                        </h4>
                    </div>
                )}
                <div className="col-12 col-md-6 text-md-end">
                    <button
                        className="btn btn-lg btn-success shadow-sm rounded-pill px-4 py-2"
                        data-bs-toggle="modal"
                        data-bs-target="#reservationModal"
                    >
                        <RiAddLine /> <span className="ms-2">{t('newreservation')}</span>
                    </button>
                </div>
            </div>
            {/* Calendar Section */}
            <div className="mt-4">
                <div className="card shadow-lg border-0 rounded-3">
                    <div className="card-body p-3">
                        <FullCalendar
                            timeZone="Europe/Athens"
                            locales={allLocales}
                            locale={t('locale') || 'en'}
                            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek",
                            }}
                            events={events}
                            eventClick={(info) => {
                                if (user.name === info.event.extendedProps.organizer) {
                                    const currentDateTime = new Date();
                                    const eventStartTime = new Date(info.event.start);
                                    if (eventStartTime < currentDateTime) {
                                        toast.error(t('errors.pastEventCannotBeEdited'));
                                        return;
                                    }
                                    handleEventClick(info.event);
                                }
                            }}
                            eventContent={(arg) => {
                                const { extendedProps, start, end } = arg.event;
                                const startTime = new Date(start).toISOString().split("T")[1].slice(0, 5);
                                const endTime = new Date(end).toISOString().split("T")[1].slice(0, 5);
                                const currentDateTime = new Date().toISOString();
                                const eventStartTime = new Date(start).toISOString();
                                const isPastEvent = eventStartTime < currentDateTime;
                                return (
                                    <div
                                        style={{
                                            padding: '5px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            maxWidth: '150px',
                                            backgroundColor: isPastEvent ? '#f8d7da' : 'transparent',
                                            color: isPastEvent ? '#721c24' : 'inherit',
                                            pointerEvents: isPastEvent ? 'none' : 'auto',
                                            opacity: isPastEvent ? 0.5 : 1,
                                            minHeight: '30px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <em>{extendedProps.organizer}</em>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            <span>{startTime} - {endTime}</span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            <h6
                                                style={{
                                                    fontSize: '10px',
                                                    margin: '0',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '80px',
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
            <div className="modal fade" id="reservationModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="reservationModalLabel" aria-hidden="true" >
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="reservationModalLabel">{selectedEvent ? "View " : t('newreservation')}</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {!user && (
                                        <div className="col-12">
                                            <label className="form-label">{t('organizer')} <span className="text-danger">*</span></label>
                                            <Select
                                                className={errors.organizer ? "is-invalid" : ""}
                                                name="organizer"
                                                options={options}
                                                value={options.find(opt => opt.value === formData.organizer) || null}
                                                onChange={selectedOption =>
                                                    handleChange({ target: { name: "organizer", value: selectedOption?.value } })
                                                }
                                                placeholder={t('searchOrganizer')}
                                                isSearchable
                                                menuPortalTarget={document.body}  // Render the dropdown outside the modal
                                                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}  // Ensure it's above the modal
                                            />
                                            {errors.organizer && <div className="invalid-feedback">{errors.organizer}</div>}
                                        </div>
                                    )}
                                    {/* Meeting Subject */}
                                    <div className="col-12">
                                        <label className="form-label">{t('meetingSubject')} <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                                            placeholder={t('enterMeetingSubject')}
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                        {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                                    </div>


                                    {/* Start Time */}
                                    <div className="col-md-6">
                                        <label className="form-label">{t('startTime')} <span className="text-danger">*</span></label>
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
                                        <label className="form-label">{t('endTime')} <span className="text-danger">*</span></label>
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
                                    <div className="col-12">
                                        <label className="form-label">{t('attendees')}</label>
                                        <Select
                                            name="attendees"
                                            value={options.filter(option => formData.attendees?.includes(option.email))}
                                            onChange={handleAttendeesChange}
                                            options={options}
                                            placeholder={t('searchAttendees')}
                                            isMulti
                                            isSearchable
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            closeMenuOnSelect={false}
                                        />
                                        {errors.attendees && <div className="invalid-feedback">{errors.attendees}</div>}
                                        <small className="form-text text-muted">
                                            {t('selectMultiple')}
                                        </small>
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                    id="closeModalButton"
                                >
                                    {t('close')}
                                </button>
                                {selectedEvent && (
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        data-bs-toggle="modal"
                                        data-bs-target="#confirmationModal"
                                        onClick={() => handleDeleteClick(selectedEvent)} // Store selected event in the state
                                    >
                                        {t('delete')}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {selectedEvent ? (isSubmitting ? t('updating') : t('update')) : (isSubmitting ? t('saving') : t('save'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* End of Modal */}
            <div className="modal fade" id="confirmationModal" tabIndex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="confirmationModalLabel">{t('confirmation')}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            {t('areYouSureDelete')}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">{t('cancel')}</button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleConfirmDelete} // Handle the confirmation of the delete
                            >
                                {t('yes')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
export default CalendarPage;