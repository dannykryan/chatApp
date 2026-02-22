"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import { User } from "../../types/user";
import Image from "next/image";

export default function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [user, setUser] = useState<User | null>(null);

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

  if (!user) return <p>Loading...</p>;

  return (
    <div className="m-4 text-center flex flex-col items-center">
      <Image
        src={user.profilePictureUrl || "/default-profile-2.png"}
        alt={`${user.username}'s profile picture`}
        width={100}
        height={100}
        className="rounded-full object-cover mb-4"
      />
      <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
      <p className="text-gray-600">{user.bio}</p>
    </div>
  );
}