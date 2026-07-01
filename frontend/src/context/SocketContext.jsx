import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect to the backend socket server
        const newSocket = io(import.meta.env.VITE_API_BASE_URL.replace('/api', ''));
        setSocket(newSocket);

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // Join personal room for notifications
                newSocket.emit("joinUserRoom", user.uid);

                // Listen for real-time notifications!
                newSocket.on("newNotification", (notification) => {
                    toast.success(notification.title + "\n" + notification.message, {
                        duration: 5000,
                        icon: '🔔',
                    });
                });
            }
        });

        return () => {
            newSocket.disconnect();
            unsubscribe();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};