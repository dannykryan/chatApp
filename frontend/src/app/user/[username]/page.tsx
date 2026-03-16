"use client";
import { use, useContext } from "react";
import { useEffect, useState } from "react";
import { User } from "../../types/user";
import UserProfileActions from "../../components/UserProfileActions";
import OwnedProfileActions from "../../components/OwnedProfileActions";
import { AuthContext } from "../../components/AuthProvider";
import ProfileSkeleton from "../../components/ProfileSkeleton";
import Avatar from "../../components/Avatar";

export default function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { user: authUser } = useContext(AuthContext);
  const { username } = use(params);
  const [user, setUser] = useState<User | null>(null);

  const isOwnProfile = authUser?.username === username;
  const displayUser = user ?? (isOwnProfile ? authUser : null);

  useEffect(() => {
    setUser(null);
  }, [username]);

  useEffect(() => {
    if (!username) return;
    fetch(`http://localhost:4000/api/user/${username}`)
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
      <h1 className="text-2xl font-bold mb-2">{displayUser.username}</h1>
      <p className="text-gray-600">{displayUser.bio}</p>
      <p className="text-gray-600 mt-2">User Since: {new Date(displayUser.createdAt).toLocaleDateString()}</p>
      <p className="text-gray-600 mt-2">Last online: {displayUser.lastOnline ? new Date(displayUser.lastOnline).toLocaleString() : "N/A"}</p>
      <div className="mt-4">
        {authUser?.username === displayUser.username ? (
          <OwnedProfileActions />
        ) : (
          <UserProfileActions friendUsername={displayUser.username} friendId={displayUser.id} />
        )}
      </div>
    </div>
  );
}
