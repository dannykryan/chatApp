"use client";
import { useContext, useState } from "react";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import Avatar from "../../../user/components/Avatar";
import { Room } from "../../../../types/dashboard";
import { FaGlobe, FaLock } from "react-icons/fa";

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

  // Dropdown filter state: 'all', 'public', 'private'
  const [roomType, setRoomType] = useState<'all' | 'public' | 'private'>('all');
  // Search input state
  const [search, setSearch] = useState('');

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

  // Filtering logic
  let filteredRooms = [...rooms];
  if (mode === "chatRoom") {
    if (roomType === "public") {
      filteredRooms = filteredRooms.filter((room) => room.isPublic);
    } else if (roomType === "private") {
      filteredRooms = filteredRooms.filter((room) => !room.isPublic);
    }
  }
  if (search.trim() !== "") {
    filteredRooms = filteredRooms.filter((room) => {
      if (mode === "dm") {
        const partner = getDmPartner(room);
        return partner?.username.toLowerCase().includes(search.toLowerCase());
      } else {
        return room.name?.toLowerCase().includes(search.toLowerCase());
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-woodsmoke">
        <h2 className="text-white font-semibold text-sm">
          {mode === "dm" ? "Direct Messages" : "Chat Rooms"}
        </h2>
        {/* Dropdown and search input stacked with labels */}
        <div className="flex flex-col gap-2 mt-3">
          {mode === "chatRoom" && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1" htmlFor="room-filter">Filter</label>
              <select
                id="room-filter"
                className="bg-woodsmoke text-white text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as 'all' | 'public' | 'private')}
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          )}
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1" htmlFor="room-search">Search</label>
            <input
              id="room-search"
              className="bg-woodsmoke text-white text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none"
              type="text"
              placeholder={mode === "dm" ? "Search by username..." : "Search rooms..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto">
        {filteredRooms
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
                  flex items-center gap-3 px-4 py-3 text-left transition-colors w-full cursor-pointer
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

                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Room name */}
                    <span className="text-sm font-medium truncate flex-1">
                      {room.name}
                    </span>

                    {/* Room meta */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {room.isPublic ? (
                        <span className="flex items-center gap-1">
                          <FaGlobe size={10} /> Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FaLock size={10} /> Private
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        {room.members.length} member{room.members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Unread badge */}
                  {room.unreadCount > 0 && (
                    <span className="flex items-center justify-center mr-auto rounded-full bg-purple min-w-4.5 h-4.5 px-1 text-white text-[12px] font-bold shrink-0">
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </span>
                  )}

                </button>
              );
            }
          })}
      </div>
    </div>
  );
}
