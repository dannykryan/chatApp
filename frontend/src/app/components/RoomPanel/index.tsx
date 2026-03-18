"use client";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider";
import Avatar from "../Avatar";
import RoomAvatar from "../RoomAvatar";
import { FaCrown, FaLock, FaGlobe } from "react-icons/fa";
import { Room, RoomMember } from "../../types/dashboard";

interface RoomPanelProps {
  room: Room;
}

export default function RoomPanel({ room }: RoomPanelProps) {
  const { user } = useContext(AuthContext);

  // Admins first, then everyone else, alphabetically within each group
  const sortedMembers = [...room.members].sort((a, b) => {
    const aIsAdmin = a.role === "admin";
    const bIsAdmin = b.role === "admin";
    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;
    return a.user.username.localeCompare(b.user.username);
  });

  const adminMembers = sortedMembers.filter((m) => m.role === "admin");
  const regularMembers = sortedMembers.filter((m) => m.role !== "admin");

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Room Header */}
      <div className="flex flex-col items-center gap-3 p-4 border-b border-woodsmoke">
        {room.imageUrl ? (
          <RoomAvatar
            imageUrl={room.imageUrl}
            label={room.name ?? "Room"}
            size="2xl"
            type="avatar"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center text-white text-xl font-bold">
            {room.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}

        <div className="text-center">
          <h2 className="text-white font-semibold text-sm">{room.name}</h2>
          {room.description && (
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{room.description}</p>
          )}
        </div>

        {/* Room meta */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {room.isPublic ? (
            <span className="flex items-center gap-1"><FaGlobe size={10} /> Public</span>
          ) : (
            <span className="flex items-center gap-1"><FaLock size={10} /> Private</span>
          )}
          <span>·</span>
          <span>{room.members.length} member{room.members.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Member List */}
      <div className="flex flex-col overflow-y-auto flex-1 py-2">

        {adminMembers.length > 0 && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-2">
              Admins — {adminMembers.length}
            </p>
            {adminMembers.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                isCurrentUser={member.userId === user?.id}
                isAdmin
              />
            ))}
          </>
        )}

        <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-2">
          Members — {regularMembers.length}
        </p>
        {regularMembers.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isCurrentUser={member.userId === user?.id}
            isAdmin={false}
          />
        ))}
      </div>
    </div>
  );
}

interface MemberRowProps {
  member: RoomMember;
  isCurrentUser: boolean;
  isAdmin: boolean;
}

function MemberRow({ member, isCurrentUser, isAdmin }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-woodsmoke transition-colors group">
      <Avatar
        src={member.user.profilePictureUrl ?? undefined}
        alt={member.user.username}
        size="md"
        showStatus
        userId={member.userId}
      />

      <div className="flex flex-col min-w-0">
        <span className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
          {member.user.username}
          {isCurrentUser && (
            <span className="text-gray-500 text-xs ml-1">(you)</span>
          )}
        </span>
      </div>

      {isAdmin && (
        <FaCrown size={10} className="text-yellow ml-2 mr-auto shrink-0" />
      )}
    </div>
  );
}