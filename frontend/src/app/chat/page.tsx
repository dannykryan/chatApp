"use client";
import React, { useRef, useEffect, useState, useContext } from "react";
import { AuthContext } from "../components/AuthProvider";
import { SocketContext } from "../components/SocketContext";

export default function Chat() {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "test message",
    "test message 2",
  ]);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const messagesContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chatMessage", handleIncomingMessage);

    // Clean up listener on unmount
    return () => {
      socket.off("chatMessage", handleIncomingMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userMessage.trim() || !socket) return;

    socket.emit("chatMessage", { username: user?.username, text: userMessage });
    setUserMessage(""); // clear input, but don't push to messages here
  }

  return (
    <div className="chat-container flex flex-col w-full h-[90vh] max-w-3xl mx-auto p-4">
      <ul
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto border rounded-lg mb-4 p-4 bg-gray-50 space-y-3"
      >
        {messages.map((message, index) => (
          <li
            key={index}
            className="px-4 py-2 rounded-lg bg-white shadow-sm max-w-[80%]"
          >
            {message}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter a message..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:cursor-pointer hover:bg-blue-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}