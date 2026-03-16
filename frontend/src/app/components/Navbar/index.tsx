// navbar with just the logout button
"use client";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider";
import LogoutButton from "../LogoutButton";
import Avatar from "../Avatar";

export default function Navbar() {
  const { user } = useContext(AuthContext);

  console.log("Navbar user:", user?.id, user?.username);
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <a href="/chat" className="text-white text-lg font-bold">
        ChatApp
      </a>
      <div className="flex items-center space-x-4">
        <LogoutButton />
        {user && (
          <>
            <a
              href={`/user/${user.username}`}
              className="text-gray-300 hover:text-white"
            >
              <Avatar
                src={user.profilePictureUrl}
                alt={`${user.username} profile picture`}
                size="md"
                showStatus
                userId={user.id}
              />
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
