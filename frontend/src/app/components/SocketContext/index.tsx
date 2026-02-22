"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "../AuthProvider";

type SocketContextType = {
  socket: Socket | null;
};

export const SocketContext = createContext<SocketContextType>({ socket: null });

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      const newSocket = io("http://localhost:4000", { auth: { token } });
      setSocket(newSocket);

      newSocket.on("connect", () => console.log("connected"));
      newSocket.on("disconnect", () => console.log("disconnected"));
      newSocket.on("welcomeMessage", (data: string) => console.log(data));
      newSocket.on("userOnline", ({ userId }: { userId: string }) => console.log(`User ${userId} is online`));
      newSocket.on("userOffline", ({ userId }: { userId: string }) => console.log(`User ${userId} is offline`));

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}