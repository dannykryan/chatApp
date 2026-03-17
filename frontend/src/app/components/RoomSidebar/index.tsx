"use client";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../AuthProvider";
import { FaEnvelope } from "react-icons/fa";
import RoomAvatar from "../RoomAvatar";
import { Room, RoomSidebarProps } from "../../types/dashboard";

export default function RoomSidebar({
  selectedRoomId,
  onSelectRoom,
  onSelectDMs,
  onRoomsLoaded,
  showingDMs,
}: RoomSidebarProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:4000/api/rooms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        onRoomsLoaded(data);
      })
      .catch(console.error);
  }, [token]);

  const groupRooms = rooms.filter((r) => r.type !== "DIRECT_MESSAGE");
  const dmRooms = rooms.filter((r) => r.type === "DIRECT_MESSAGE");

  // For DMs, show the other user's avatar instead of a room image
  const getDmPartner = (room: Room) => {
    return room.members.find((m) => m.userId !== user?.id)?.user ?? null;
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-2 h-full bg-woodsmoke overflow-y-auto">

      {/* DM Button */}
      <button
        onClick={onSelectDMs}
        title="Direct Messages"
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all
          ${showingDMs
            ? "bg-purple text-white ring-2 ring-purple ring-offset-2 ring-offset-woodsmoke"
            : "bg-charade text-gray-400 hover:text-white hover:bg-purple"
          }
        `}
      >
        <FaEnvelope size={16} />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-gray-600" />

      {/* Group / Public Rooms */}
      {groupRooms.map((room) => (
        <RoomAvatar
          key={room.id}
          label={room.name ?? "Room"}
          imageUrl={room.imageUrl}
          isSelected={selectedRoomId === room.id}
          onClick={() => onSelectRoom(room)}
        />
      ))}
    </div>
  );
}