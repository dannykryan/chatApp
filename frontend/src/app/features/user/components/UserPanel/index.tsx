"use client";
import { useEffect, useState, useContext } from "react";
import { API_URL } from "../../../../shared/utils/api";
import { User } from "../../../../types/user";
import UserProfileActions from "../UserProfileActions";
import OwnedProfileActions from "../OwnedProfileActions";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import ProfileSkeleton from "../ProfileSkeleton";
import Avatar from "../Avatar";
import { FaCalendarAlt } from "react-icons/fa";

interface UserPanelProps {
  username: string;
}

export default function UserPanel({ username }: UserPanelProps) {
  const { user: authUser } = useContext(AuthContext);
  const [user, setUser] = useState<User | null>(null);

  const isOwnProfile = authUser?.username === username;
  const displayUser = user ?? (isOwnProfile ? authUser : null);

  useEffect(() => {
    if (!username) return;
    fetch(`${API_URL}/user/${username}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched user data:", data);
        setUser(data);
      })
      .catch((err) => console.error("Fetch failed:", err));
  }, [username]);

  if (!displayUser) return <ProfileSkeleton />;
  console.log("Displaying user:", displayUser);

  return (
    <div className="m-4 flex flex-col items-center">
      <Avatar
        src={displayUser.profilePictureUrl || "/default-profile-2.png"}
        alt={`${displayUser.username}'s profile picture`}
        size="3xl"
        showStatus
        userId={displayUser.id}
      />
      <h1 className="mt-4 text-2xl text-white font-bold mb-2">
        {displayUser.username}
      </h1>
      <p className="text-white">{displayUser.bio}</p>
      <div className="flex items-center gap-2 mt-3 text-gray-400">
        <FaCalendarAlt />
        <p>
          Joined{" "}
          {new Date(displayUser.createdAt).toLocaleDateString([], {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      <p className="text-gray-400 mt-2">
        Last online:{" "}
        {displayUser.lastOnline
          ? new Date(displayUser.lastOnline).toLocaleString()
          : "N/A"}
      </p>
      <div className="mt-4">
        {authUser?.username === displayUser.username ? (
          <OwnedProfileActions />
        ) : (
          <UserProfileActions
            friendUsername={displayUser.username}
            friendId={displayUser.id}
          />
        )}
      </div>
    </div>
  );
}
