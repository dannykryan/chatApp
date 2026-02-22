// navbar with just the logout button
"use client";
import React, { useContext } from "react";
import { AuthContext } from "../AuthProvider";
import LogoutButton from "../LogoutButton";

export default function Navbar() {
  const { user } = useContext(AuthContext);
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <a href="/chat" className="text-white text-lg font-bold">Chat</a>
        <div className="flex items-center space-x-4">
        <LogoutButton />
        {user && (
          <>
            <a href={`/user/${user.username}`} className="text-gray-300 hover:text-white">
            <img
                src={user.profilePictureUrl || "/default-profile.png"}
                alt={`${user.username}'s profile picture`}
                className="w-8 h-8 rounded-full object-cover"
              />
            </a>
            </>
          )}
      </div>
    </nav>
  );
}