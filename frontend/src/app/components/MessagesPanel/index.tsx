"use client";
import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../AuthProvider";
import Avatar from "../Avatar";
import type { Room } from "../../types/dashboard";

interface Message {
  id: string;
  content: string;
  sentAt: string;
  editedAt: string | null;
  senderId: string;
  sender: {
    id: string;
    username: string;
    profilePictureUrl: string | null;
  };
}

interface MessagesPanelProps {
  room: Room | null;
}

export default function MessagesPanel({ room }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!room || !token) return;

    setLoading(true);
    setMessages([]);

    fetch(`${API_URL}/rooms/${room.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [room?.id, token]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">Select a room to view messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">Loading messages...</p>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  };

  // Group messages and inject date dividers
  const messagesWithDividers: Array<{ type: "divider"; label: string } | { type: "message"; message: Message }> = [];
  let lastDate = "";

  for (const message of messages) {
    const dateKey = new Date(message.sentAt).toDateString();
    if (dateKey !== lastDate) {
      messagesWithDividers.push({ type: "divider", label: formatDateDivider(message.sentAt) });
      lastDate = dateKey;
    }
    messagesWithDividers.push({ type: "message", message });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Room header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-charade shrink-0">
        {room.imageUrl ? (
          <img
            src={room.imageUrl}
            alt={room.name ?? "Room"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
            {room.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <h2 className="text-white font-semibold text-sm">{room.name}</h2>
          {room.description && (
            <p className="text-gray-500 text-xs truncate">{room.description}</p>
          )}
        </div>
      </div>

      {/* Messages — scrollable, anchored to bottom */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col flex-1 overflow-y-auto px-4 py-4 gap-1"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-gray-500 text-sm">No messages yet. Say something!</p>
          </div>
        )}

        {messagesWithDividers.map((item, index) => {
          if (item.type === "divider") {
            return (
              <div key={`divider-${index}`} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-charade" />
                <span className="text-gray-500 text-xs">{item.label}</span>
                <div className="flex-1 h-px bg-charade" />
              </div>
            );
          }

          const { message } = item;
          const isOwn = message.senderId === user?.id;

          return (
            <div
              key={message.id}
              className={`flex items-end pb-2 gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className="shrink-0 mb-1">
                <Avatar
                  src={message.sender.profilePictureUrl ?? undefined}
                  alt={message.sender.username}
                  size="md"
                  userId={message.sender.id}
                />
              </div>

              {/* Bubble */}
              <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                {/* Username + time */}
                <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-xs font-medium text-gray-300">
                    {isOwn ? "You" : message.sender.username}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(message.sentAt)}</span>
                  {message.editedAt && (
                    <span className="text-xs text-gray-600 italic">(edited)</span>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`
                    px-3 py-2 rounded-2xl text-sm text-gray-100 leading-relaxed wrap-break-word
                    ${isOwn
                      ? "bg-purple rounded-tr-sm"
                      : "bg-charade rounded-tl-sm"
                    }
                  `}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Anchor to scroll to */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}