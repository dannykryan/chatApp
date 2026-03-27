"use client";
import { useContext } from "react";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import Avatar from "../../../user/components/Avatar";
import { Room } from "../../../../types/dashboard";

interface RoomListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
  mode: "dm" | "chatRoom";
}

export default function RoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  mode,
}: RoomListProps) {
  const { user } = useContext(AuthContext);

  // For DMs, get the other user
  const getDmPartner = (room: Room) => {
    return room.members.find((m) => m.userId !== user?.id)?.user ?? null;
  };

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col h-full p-4">
        <h2 className="text-white font-semibold text-sm mb-4">
          {mode === "dm" ? "Direct Messages" : "Chat Rooms"}
        </h2>
        <p className="text-gray-500 text-sm">
          {mode === "dm" ? "No direct messages yet." : "No chat rooms yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-woodsmoke">
        <h2 className="text-white font-semibold text-sm">
          {mode === "dm" ? "Direct Messages" : "Chat Rooms"}
        </h2>
      </div>

      <div className="flex flex-col overflow-y-auto">
        {[...rooms]
          .sort((a, b) => {
            const aTime = a.lastMessageAt
              ? new Date(a.lastMessageAt).getTime()
              : 0;
            const bTime = b.lastMessageAt
              ? new Date(b.lastMessageAt).getTime()
              : 0;
            return bTime - aTime; // most recent first
          })
          .map((room) => {
            const isSelected = selectedRoomId === room.id;

            if (mode === "dm") {
              const partner = getDmPartner(room);
              if (!partner) return null;
              return (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className={`
                  flex items-center gap-3 px-4 py-3 text-left transition-colors w-full
                  ${
                    isSelected
                      ? "bg-woodsmoke text-white"
                      : "text-gray-400 hover:bg-woodsmoke hover:text-white"
                  }
                `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={partner.profilePictureUrl}
                      alt={partner.username}
                      size="sm"
                      userId={partner.id}
                      showStatus={true}
                    />
                  </div>

                  {/* Username */}
                  <span className="text-sm font-medium truncate flex-1">
                    {partner.username}
                  </span>

                  {/* Unread badge */}
                  {room.unreadCount > 0 && (
                    <span className="flex items-center justify-center mr-auto rounded-full bg-purple min-w-4.5 h-4.5 px-1 text-white text-[12px] font-bold shrink-0">
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </span>
                  )}
                </button>
              );
            } else {
              // Chat room mode
              return (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className={`
                  flex items-center gap-3 px-4 py-3 text-left transition-colors w-full
                  ${
                    isSelected
                      ? "bg-woodsmoke text-white"
                      : "text-gray-400 hover:bg-woodsmoke hover:text-white"
                  }
                `}
                >
                  {/* Room image or fallback */}
                  <div className="relative shrink-0">
                    {room.imageUrl ? (
                      <Avatar
                        src={room.imageUrl}
                        alt={room.name ?? "Room"}
                        size="sm"
                        userId={room.id}
                        showStatus={false}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white text-base font-bold">
                        {room.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* Room name */}
                  <span className="text-sm font-medium truncate flex-1">
                    {room.name}
                  </span>
                </button>
              );
            }
          })}
      </div>
    </div>
  );
}
