import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { useSocket } from '../context/SocketContext';
import axiosInstance from '../api/axiosInstance';

function ProjectChat({ projectId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const socket = useSocket();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) setCurrentUser(user);

        // 1. Fetch historical messages
        const fetchMessages = async () => {
            try {
                const res = await axiosInstance.get(`/messages/${projectId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchMessages();

        // 2. Join the Socket Room & Listen for new messages
        if (socket) {
            socket.emit("joinProjectRoom", projectId);

            const messageListener = (message) => {
                setMessages((prev) => [...prev, message]);
            };

            socket.on("receiveMessage", messageListener);

            return () => {
                socket.off("receiveMessage", messageListener);
            };
        }
    }, [projectId, socket]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !currentUser) return;

        const messageData = {
            projectId,
            senderUid: currentUser.uid,
            senderName: currentUser.displayName?.split(' ')[0] || "User",
            text: newMessage
        };

        // Send via Socket
        socket.emit("sendMessage", messageData);
        setNewMessage("");
    };

    return (
        <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl h-[500px] overflow-hidden shadow-sm">
            {/* Chat Header */}
            <div className="bg-brickRed text-white px-4 py-3 font-bold flex items-center shadow-md z-10">
                <svg className="w-5 h-5 mr-2 opacity-80" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path></svg>
                Project Team Chat
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">
                        Start the conversation! Say hello to the team.
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = currentUser?.uid === msg.senderUid;
                        return (
                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && <span className="text-[10px] text-gray-500 ml-1 mb-1 font-semibold">{msg.senderName}</span>}
                                <div className={`px-4 py-2 max-w-[80%] rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brickRed text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex gap-2">
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-brickRed focus:ring-0 rounded-full px-4 text-sm"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-brickRed hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors shadow-sm">
                <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
                </button>
            </form>
        </div>
    );
}

export default ProjectChat;