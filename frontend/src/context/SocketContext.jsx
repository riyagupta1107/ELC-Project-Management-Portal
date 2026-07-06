import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // NEW: Use JWT Auth Context
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Retrieve the user state

    useEffect(() => {
        // Connect to the backend socket server
        const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');
        setSocket(newSocket);

        if (user) {
            // Join personal room for notifications using MongoDB _id
            newSocket.emit("joinUserRoom", user._id);

            // Listen for real-time notifications!
            newSocket.on("newNotification", (notification) => {
                toast.success(notification.title + "\n" + notification.message, {
                    duration: 5000,
                    icon: '🔔',
                });
            });
        }

        return () => {
            newSocket.disconnect();
        };
    }, [user]); // Re-run when user state changes

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};