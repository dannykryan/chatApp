"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SocketContext } from "../SocketContext";

type PresenceContextType = {
  isUserOnline: (userId?: string) => boolean;
};

const PresenceContext = createContext<PresenceContextType>({
  isUserOnline: () => false,
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useContext(SocketContext);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const onPresenceInit = ({ userIds }: { userIds: string[] }) => {
      console.log("presence:init received", userIds);
      setOnlineIds(new Set(userIds));
    };

    const onOnline = ({ userId }: { userId: string }) => {
      setOnlineIds((prev) => new Set(prev).add(userId));
    };

    const onOffline = ({ userId }: { userId: string }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    // Request presence when socket connects (or reconnects)
    const onConnect = () => {
      console.log("Socket connected, requesting presence");
      socket.emit("presence:request");
    };

    socket.on("presence:init", onPresenceInit);
    socket.on("userOnline", onOnline);
    socket.on("userOffline", onOffline);
    socket.on("connect", onConnect);

    // Socket already connected before this effect ran
    if (socket.connected) {
      socket.emit("presence:request");
    }

    return () => {
      socket.off("presence:init", onPresenceInit);
      socket.off("userOnline", onOnline);
      socket.off("userOffline", onOffline);
      socket.off("connect", onConnect);
    };
  }, [socket]);

  const value = useMemo(
    () => ({
      isUserOnline: (userId?: string) =>
        userId ? onlineIds.has(userId) : false,
    }),
    [onlineIds],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
