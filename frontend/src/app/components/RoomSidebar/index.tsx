"use client";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../AuthProvider";
import { FaEnvelope } from "react-icons/fa";
import RoomAvatar from "../RoomAvatar";
import { Room, RoomSidebarProps } from "../../types/dashboard";
import ButtonRound from "../ButtonRound";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    fetch(`${API_URL}/rooms`, {
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

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-2 h-full bg-woodsmoke overflow-y-auto">

      {/* DM Button */}
      <ButtonRound
        onClick={onSelectDMs}
        isSelected={showingDMs}
        title="Direct Messages"
      >
        <FaEnvelope size={24} />
      </ButtonRound>

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
          size="lg"
          type="button"
        />
      ))}
    </div>
  );
}