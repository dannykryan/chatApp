import type { User } from "./user";

export interface RoomMember {
  userId: string;
  role: "admin" | "member" | null;
  user: User;
};

export interface Room {
  id: string;
  name: string | null;
  type: "PUBLIC_BOARD" | "PRIVATE_GROUP" | "DIRECT_MESSAGE";
  imageUrl: string | null;
  description: string | null;
  isPublic: boolean;
  members: RoomMember[];
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface RoomSidebarProps {
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
  onSelectDMs: () => void;
  onRoomsLoaded: (rooms: Room[]) => void;
  showingDMs: boolean;
  rooms: Room[];
}
