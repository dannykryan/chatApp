"use client";
import { useContext, useState } from "react";
import { AuthContext } from "../AuthProvider";
import { useRouter } from "next/navigation";
import Avatar from "../Avatar";
import { TbLogout } from "react-icons/tb";
import { logoutUser } from "../../utils/auth";
import { useConfirm } from "../../hooks/useConfirm/index";

export default function UserPanel() {
  const { setUser, setToken } = useContext(AuthContext);
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const confirm = useConfirm();

  const handleLogout = async () => {
      const confirmed = await confirm({
        title: "Confirm Logout",
        message: "Are you sure you want to logout?",
        confirmLabel: "Logout",
        confirmStyle: "danger",
      });
  
      if (confirmed) {
        logoutUser(setUser, setToken, router);
      }
    };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full p-3">

      {/* User card */}
      <div className="flex items-center gap-3 bg-woodsmoke rounded-xl px-3 py-2">
        <Avatar
          src={user.profilePictureUrl ?? undefined}
          alt={user.username}
          size="lg"
          showStatus
          userId={user.id}
        />

        <span className="text-sm text-white font-medium truncate flex-1">
          {user.username}
        </span>

        <button
          onClick={handleLogout}
          className="text-gray-100 hover:text-purple transition-colors shrink-0"
          title="Log out"
        >
          <TbLogout size={32} />
        </button>
      </div>

      {/* Rest of panel — placeholder for now */}
      <div className="flex-1 mt-4">
        {/* Future controls go here */}
      </div>
    </div>
  );
}