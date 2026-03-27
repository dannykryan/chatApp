"use client";
import { useState, useContext, useEffect } from "react";
import { API_URL } from "../shared/utils/api";
import RoomSidebar from "../features/rooms/components/RoomSidebar";
import RoomList from "../features/chat/components/RoomList";
import RoomPanel from "../features/rooms/components/RoomPanel";
import { Room } from "../types/dashboard";
import MessagesPanel from "../features/chat/components/MessagesPanel";
import ControlPanel from "../features/user/components/UserControlPanel";
import { SocketContext } from "../shared/context/SocketProvider";
import { AuthContext } from "../shared/context/AuthProvider";
import UserPanel from "../features/user/components/UserPanel";
import ButtonRound from "../shared/components/ButtonRound";
import { FaArrowLeft } from "react-icons/fa";

// Each column tracks a history stack of views.
// reset() sets a new "home", push() drills deeper, pop() goes back.
type PanelView =
  | { type: "empty" }
  | { type: "chatRoom" }
  | { type: "room"; room: Room }
  | { type: "dmList" }
  | { type: "profile"; username: string };

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingDM, setPendingDM] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  // activeRoom tracks the selected DM room (not stored in col2 history)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [col2History, setCol2History] = useState<PanelView[]>([
    { type: "dmList" },
  ]);
  const [col3History, setCol3History] = useState<PanelView[]>([
    { type: "empty" },
  ]);

  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  // Always read the top of each history stack to determine what to show
  const col2View = col2History[col2History.length - 1];
  const col3View = col3History[col3History.length - 1];

  // Navigation helpers
  const pushCol2 = (view: PanelView) =>
    setCol2History((prev) => [...prev, view]);
  const pushCol3 = (view: PanelView) =>
    setCol3History((prev) => [...prev, view]);
  const resetCol2 = (view: PanelView) => setCol2History([view]);
  const resetCol3 = (view: PanelView) => setCol3History([view]);
  const popCol2 = () =>
    setCol2History((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const popCol3 = () =>
    setCol3History((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  // The currently open room — either a group room from col2 or a DM from activeRoom
  const selectedRoom = col2View.type === "room" ? col2View.room : activeRoom;

  const handleSelectRoom = (room: Room, isDM = false) => {
    if (isDM) {
      setActiveRoom(room);
      resetCol3({ type: "empty" });
    } else {
      setActiveRoom(null);
      resetCol2({ type: "room", room });
      resetCol3({ type: "empty" });
    }
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r)),
    );
  };

  // Opening a profile pushes to col3 so the user can go back to messages
  const handleSelectAvatar = (username: string) => {
    pushCol3({ type: "profile", username });
  };

  // Switching to DMs or chat rooms resets col2
  const handleSelectDMs = (roomType: "dmList" | "chatRoom" = "dmList") => {
    resetCol2({ type: roomType });
  };

  const openDirectMessage = (friendId: string, friendUsername: string) => {
    const existingDM = rooms.find(
      (r) =>
        r.type === "DIRECT_MESSAGE" &&
        r.members.some((m) => m.userId === friendId),
    );
    if (existingDM) {
      handleSelectRoom(existingDM, true);
      return;
    }
    resetCol2({ type: "dmList" });
    setActiveRoom(null);
    setPendingDM({ userId: friendId, username: friendUsername });
    resetCol3({ type: "empty" });
  };

  const dmRooms = rooms.filter((r) => r.type === "DIRECT_MESSAGE");
  const chatRooms = rooms.filter((r) => r.type !== "DIRECT_MESSAGE");

  // Listen for new messages and new DM rooms
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: {
      roomId: string;
      senderId: string;
    }) => {
      // Don't increment unread for the currently selected room
      if (message.senderId === user?.id) return;

      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== message.roomId) return room;
          if (selectedRoom?.id === room.id) return room; // room is open, don't increment
          return {
            ...room,
            lastMessageAt: new Date().toISOString(),
            unreadCount: (room.unreadCount ?? 0) + 1,
          };
        }),
      );
      const messageReceivedSound = new Audio("/sounds/bubble_pop.mp3");
      messageReceivedSound.play();
    };

    const handleNewDMRoom = (newRoom: Room) => {
      console.log("New DM room created:", newRoom);
      setRooms((prev) => {
        // Only add room if not already present
        if (prev.some((room) => room.id === newRoom.id)) return prev;
        return [newRoom, ...prev]; // Add to top
      });
    };

    socket.on("message:new", handleNewMessage);
    socket.on("dm:new", handleNewDMRoom);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("dm:new", handleNewDMRoom);
    };
  }, [socket, selectedRoom?.id, user?.id]);

  return (
    <div className="grid grid-cols-12 h-screen">
      {/* Column 1: 1/12 — Room sidebar */}
      <div className="col-span-1 bg-woodsmoke border-r border-charade">
        <RoomSidebar
          selectedRoomId={selectedRoom?.id ?? null}
          onSelectRoom={handleSelectRoom}
          onSelectDMs={handleSelectDMs}
          onRoomsLoaded={setRooms}
          rooms={rooms}
          showingDMs={col2View.type === "dmList"}
          showingChatRooms={col2View.type === "chatRoom"}
        />
      </div>

      {/* Column 2: 3/12 — DM list or room member list */}
      <div className="col-span-3 bg-charade border-r border-woodsmoke flex flex-col">
        {col2History.length > 1 && (
          <div className="absolute top-2 left-2 z-10">
            <ButtonRound onClick={popCol2} title="Back">
              <FaArrowLeft size={20} />
            </ButtonRound>
          </div>
        )}
        {col2View.type === "dmList" && (
          <RoomList
            rooms={dmRooms}
            mode="dm"
            selectedRoomId={selectedRoom?.id ?? null}
            onSelectRoom={(room) => handleSelectRoom(room, true)}
          />
        )}
        {col2View.type === "chatRoom" && (
          <RoomList
            rooms={chatRooms}
            mode="chatRoom"
            selectedRoomId={selectedRoom?.id ?? null}
            onSelectRoom={(room) => handleSelectRoom(room, true)}
          />
        )}
        {col2View.type === "room" && <RoomPanel room={col2View.room} />}
        {col2View.type === "empty" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">Select a room</p>
          </div>
        )}
      </div>

      {/* Column 3: 6/12 — Messages */}
      <div className="col-span-6 bg-woodsmoke overflow-hidden flex flex-col relative">
        {col3History.length > 1 && (
          <div className="absolute top-2 left-2 z-10">
            <ButtonRound onClick={popCol3} title="Back">
              <FaArrowLeft size={20} />
            </ButtonRound>
          </div>
        )}
        {col3View.type === "profile" && (
          <UserPanel
            username={col3View.username}
            openDirectMessage={openDirectMessage}
          />
        )}
        {col3View.type === "empty" && (
          <MessagesPanel
            room={selectedRoom}
            onSelectAvatar={handleSelectAvatar}
            pendingDM={pendingDM}
            setPendingDM={setPendingDM}
            setActiveRoom={setActiveRoom}
          />
        )}
      </div>

      {/* Column 4: 2/12 — Members / info */}
      <div className="col-span-2 bg-charade">
        <ControlPanel onSelectAvatar={handleSelectAvatar} />
      </div>
    </div>
  );
}
