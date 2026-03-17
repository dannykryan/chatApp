"use client";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider";
import Avatar from "../Avatar";

interface RoomMember {
  userId: string;
  user: {
    id: string;
    username: string;
    profilePictureUrl: string | null;
    isOnline: boolean;
  };
}

interface Room {
  id: string;
  name: string | null;
  type: "PUBLIC_BOARD" | "PRIVATE_GROUP" | "DIRECT_MESSAGE";
  imageUrl: string | null;
  description: string | null;
  isPublic: boolean;
  members: RoomMember[];
}

interface DMListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
}

export default function DMList({ rooms, selectedRoomId, onSelectRoom }: DMListProps) {
  const { user } = useContext(AuthContext);

  const getDmPartner = (room: Room) => {
    return room.members.find((m) => m.userId !== user?.id)?.user ?? null;
  };

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col h-full p-4">
        <h2 className="text-white font-semibold text-sm mb-4">Direct Messages</h2>
        <p className="text-gray-500 text-sm">No direct messages yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-woodsmoke">
        <h2 className="text-white font-semibold text-sm">Direct Messages</h2>
      </div>

      <div className="flex flex-col overflow-y-auto">
        {rooms.map((room) => {
          const partner = getDmPartner(room);
          if (!partner) return null;

          const isSelected = selectedRoomId === room.id;

          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`
                flex items-center gap-3 px-4 py-3 text-left transition-colors w-full
                ${isSelected
                  ? "bg-woodsmoke text-white"
                  : "text-gray-400 hover:bg-woodsmoke hover:text-white"
                }
              `}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {partner.profilePictureUrl ? (
                  <Avatar 
                    src={partner.profilePictureUrl} 
                    alt={partner.username} 
                    size="sm"
                    userId={partner.id}
                    showStatus={true}
                  />
                ) : (
                  <Avatar 
                    src={undefined} 
                    alt={partner.username} 
                    size="sm"
                    userId={partner.id}
                    showStatus={true}
                  />
                )}
              </div>

              {/* Username */}
              <span className="text-sm font-medium truncate">{partner.username}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}