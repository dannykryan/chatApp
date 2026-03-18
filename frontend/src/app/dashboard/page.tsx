"use client";
import { useState, useContext, useEffect } from "react";
import RoomSidebar from "../components/RoomSidebar";
import DMList from "../components/DMList";
import RoomPanel from "../components/RoomPanel";
import { Room } from "../types/dashboard";
import MessagesPanel from "../components/MessagesPanel";
import UserPanel from "../components/UserPanel";
import { SocketContext } from "../components/SocketContext";
import { AuthContext } from "../components/AuthProvider";

export default function Dashboard() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showingDMs, setShowingDMs] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  const dmRooms = rooms.filter((r) => r.type === "DIRECT_MESSAGE");

  // Listen for new messages and update unread counts
  useEffect(() => {
    if (!socket) return;

    const messageReceivedSound = new Audio("/sounds/bubble_pop.mp3");

    const handleNewMessage = (message: { roomId: string; senderId: string }) => {
      // Don't increment unread for the currently selected room
      if (message.senderId === user?.id) return;

      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== message.roomId) return room;
          if (selectedRoom?.id === room.id) return room; // room is open, don't increment
          return { ...room, unreadCount: (room.unreadCount ?? 0) + 1 };
        })
      );
      const messageReceivedSound = new Audio("/sounds/bubble_pop.mp3");
      messageReceivedSound.play();
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, selectedRoom?.id, user?.id]);

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowingDMs(false);
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );
  };

  const handleSelectDM = (room: Room ) => {
    setSelectedRoom(room);
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );
  }

  const handleSelectDMs = () => {
    setShowingDMs(true);
    setSelectedRoom(null);
  };

  return (
    <div className="grid grid-cols-12 h-screen">
      {/* Column 1: 1/12 — Room sidebar */}
      <div className="col-span-1 bg-woodsmoke border-r border-charade">
        <RoomSidebar
          selectedRoomId={selectedRoom?.id ?? null}
          onSelectRoom={handleSelectRoom}
          onSelectDMs={handleSelectDMs}
          showingDMs={showingDMs}
          onRoomsLoaded={setRooms}
          rooms={rooms}
        />
      </div>

      {/* Column 2: 3/12 — DM list or room member list */}
      <div className="col-span-3 bg-charade border-r border-woodsmoke">
        {showingDMs ? (
          <DMList
            rooms={dmRooms}
            selectedRoomId={selectedRoom?.id ?? null}
            onSelectRoom={handleSelectDM}
          />
        ) : selectedRoom ? (
          <RoomPanel room={selectedRoom} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">Select a room</p>
          </div>
        )}
      </div>

      {/* Column 3: 6/12 — Messages */}
      <div className="col-span-6 bg-woodsmoke overflow-hidden">
        <MessagesPanel room={selectedRoom} />        
      </div>

      {/* Column 4: 2/12 — Members / info */}
      <div className="col-span-2 bg-charade">
        <UserPanel />
      </div>
    </div>
  );
}
