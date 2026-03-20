"use client";
import { use, useContext } from "react";
import { useEffect, useState } from "react";
import { User } from "../../types/user";
import UserProfileActions from "../../components/UserProfileActions";
import OwnedProfileActions from "../../components/OwnedProfileActions";
import { AuthContext } from "../../components/AuthProvider";
import ProfileSkeleton from "../../components/ProfileSkeleton";
import Avatar from "../../components/Avatar";
import { FaCalendarAlt } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    <div className="m-4 text-center flex flex-col items-center">
      <Avatar
        src={displayUser.profilePictureUrl || "/default-profile-2.png"}
        alt={`${displayUser.username}'s profile picture`}
        size="3xl"
        showStatus
        userId={displayUser.id}
      />
      <h1 className="mt-4 text-2xl text-white font-bold mb-2">{displayUser.username}</h1>
      <p className="text-white">{displayUser.bio}</p>
      <div className="flex items-center gap-2 mt-3 text-gray-400">
        <FaCalendarAlt />
        <p>
          Joined {new Date(displayUser.createdAt).toLocaleDateString([], { month: "long", year: "numeric" })}
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
