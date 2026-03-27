"use client";
import { useEffect, useContext } from "react";
import { API_URL } from "../../../../shared/utils/api";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import { FaEnvelope, FaComments } from "react-icons/fa";
import RoomAvatar from "../RoomAvatar";
import { RoomSidebarProps } from "../../../../types/dashboard";
import ButtonRound from "../../../../shared/components/ButtonRound";

export default function RoomSidebar({
  selectedRoomId,
  onSelectRoom,
  onSelectDMs,
  onRoomsLoaded,
  showingDMs,
  showingChatRooms,
  rooms,
}: RoomSidebarProps) {
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        onRoomsLoaded(data);
      })
      .catch(console.error);
  }, [token]);

  const groupRooms = rooms.filter((r) => r.type !== "DIRECT_MESSAGE");

  const DMUnreadCount = rooms
    .filter((r) => r.type === "DIRECT_MESSAGE")
    .reduce((sum, r) => sum + (r.unreadCount ?? 0), 0);

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-2 h-full bg-woodsmoke overflow-y-auto">
      {/* DM Button */}
      <ButtonRound
        onClick={() => onSelectDMs("dmList")}
        isSelected={showingDMs}
        title="Direct Messages"
        unread={DMUnreadCount}
      >
        <FaEnvelope size={24} />
      </ButtonRound>
      {/* Rooms Button */}
      <ButtonRound
        onClick={() => onSelectDMs("chatRoom")}
        isSelected={showingChatRooms}
        title="Chat Rooms"
        unread={DMUnreadCount}
      >
        <FaComments size={24} />
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
          unread={room.unreadCount}
        />
      ))}
    </div>
  );
}
