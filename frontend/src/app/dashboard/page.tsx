"use client";
import { useState } from "react";
import RoomSidebar from "../components/RoomSidebar";
import DMList from "../components/DMList";
import RoomPanel from "../components/RoomPanel";
import { Room } from "../types/dashboard";

export default function Dashboard() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showingDMs, setShowingDMs] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  const dmRooms = rooms.filter((r) => r.type === "DIRECT_MESSAGE");

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowingDMs(false);
  };

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
        />
      </div>

      {/* Column 2: 3/12 — DM list or room member list */}
      <div className="col-span-3 bg-charade border-r border-woodsmoke">
        {showingDMs ? (
          <DMList
            rooms={dmRooms}
            selectedRoomId={selectedRoom?.id ?? null}
            onSelectRoom={handleSelectRoom}
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
      <div className="col-span-6 bg-woodsmoke p-4">
        {selectedRoom ? (
          <div className="flex items-center gap-3 border-b border-charade pb-4 mb-4">
            {selectedRoom.imageUrl && (
              <img
                src={selectedRoom.imageUrl}
                alt={selectedRoom.name ?? ""}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-white font-semibold">{selectedRoom.name}</h2>
              {selectedRoom.description && (
                <p className="text-gray-400 text-sm">
                  {selectedRoom.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Select a room to view messages
          </p>
        )}
      </div>

      {/* Column 4: 2/12 — Members / info */}
      <div className="col-span-2 bg-charade p-4">
        <p className="text-gray-400 text-sm">Members</p>
      </div>
    </div>
  );
}
