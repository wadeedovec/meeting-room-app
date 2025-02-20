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
        label: user.displayName
    }));
    const [rooms, setRooms] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
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
            newErrors.organizer = t('errors.organizerRequired');
        }
        if (!formData.subject.trim()) {
            newErrors.subject = t('errors.subjectRequired');
        }
        if (!formData.startTime) {
            newErrors.startTime = t('errors.startTimeRequired');
        }
        if (!formData.endTime) {
            newErrors.endTime = t('errors.endTimeRequired');
        }
        if (formData.startTime && formData.endTime) {
            const startTime = new Date(formData.startTime);
            const endTime = new Date(formData.endTime);
            if (startTime >= endTime) {
                newErrors.time = t('errors.startTimeBeforeEndTime');
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
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
            toast.error(t('errors.meetingRoomRequired'));
            return;
        }
        setIsSubmitting(true);
        const newStartUTC = new Date(formData.startTime).toISOString();
        const newEndUTC = new Date(formData.endTime).toISOString();
        const now = new Date();
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
        try {
            const hasConflict = events.some(reservation => {
                const existingStart = new Date(reservation.start).toISOString();
                const existingEnd = new Date(reservation.end).toISOString();
                return newStartUTC < existingEnd && newEndUTC > existingStart;
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
                    dateTime: newStartUTC,
                    timeZone: "UTC",
                },
                end: {
                    dateTime: newEndUTC,
                    timeZone: "UTC",
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
            const headers = {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            };
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${user ? selectedUser.email : selectedUser.mail}/calendar/events`, {
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
            const dbPayload = {
                subject: formData.subject,
                start: newStartUTC,
                end: newEndUTC,
                organizer: user ? selectedUser.email : selectedUser.mail,
                meetingRoomId: selectedRoom,
            };
            const dbResponse = await fetch(`${import.meta.env.VITE_API_URI}reservations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dbPayload),
            });
            if (!dbResponse.ok || !response.ok) {
                throw new Error("Failed to create reservation");
            } else {
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
            }
        } catch (e) {
            console.error("Error:", e);
            toast.error(t('errors.failedToCreateReservation'));
        } finally {
            setIsSubmitting(false);
        }
    };
    const fetchReservations = async (roomId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URI}reservations/room/${roomId}`);
            if (!response.ok) {
                throw new Error("Room reservations");
            }
            const data = await response.json();
            if (MsUsers.length === 0) {
                console.log("MsUsers is empty, retrying...");
                return;
            }
            const getDisplayName = (user) => {
                const msUser = MsUsers.find((u) => u.mail === user.organizer);
                return msUser ? msUser.displayName : t('errors.unknown');
            };
            const calendarEvents = data.data.map((event) => ({
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
        const apiKey = import.meta.env.VITE_INTERNAL_API_KEY;
        const tokenResponse = await fetch(`${import.meta.env.VITE_API_URI}getAccessToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
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
            const response = await fetch(`${import.meta.env.VITE_API_URI}rooms/`);
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
            const response = await fetch(`${import.meta.env.VITE_API_URI}rooms/${roomId}`);
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
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="reservationModalLabel">{t('newreservation')}</h5>
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
                                            placeholder="Enter meeting subject"
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
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">{t('close')}</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? t('saving') : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div >
    );
};
export default CalendarPage;