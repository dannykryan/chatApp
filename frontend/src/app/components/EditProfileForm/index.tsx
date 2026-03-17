"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Button from "../Button";
import { FaCamera } from "react-icons/fa";
import { User } from "../../types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type EditProfileFormProps = {
  initialValues: {
    username: string;
    email: string | undefined;
    bio?: string | null;
    profilePictureUrl?: string | null;
  };
  onCancel: () => void;
  onSaved: (updatedUser: User) => void;
};

export default function EditProfileForm({
  initialValues,
  onCancel,
  onSaved,
}: EditProfileFormProps) {
  const [username, setUsername] = useState(initialValues.username);
  const [email, setEmail] = useState(initialValues.email);
  const [bio, setBio] = useState(initialValues.bio ?? "");
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    initialValues.profilePictureUrl ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setImageError("Please select an image file");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setImageError("Image must be under 2MB");
    return;
  }

  setImageError(null);
  setUploadingImage(true);

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/user/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // Don't set Content-Type here — the browser sets it automatically with the boundary for multipart
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");

    setProfilePictureUrl(data.profilePictureUrl);
  } catch (err) {
    setImageError(err instanceof Error ? err.message : "Upload failed");
  } finally {
    setUploadingImage(false);
  }
};

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/user/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email, bio, profilePictureUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      onSaved(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-2">
        <div
          onClick={handleImageClick}
          className="relative w-24 h-24 rounded-full cursor-pointer group"
        >
          <Image
            src={profilePictureUrl || "/default-profile-2.png"}
            alt="Profile picture"
            fill
            className="rounded-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingImage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaCamera className="text-white text-xl" />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {uploadingImage ? "Uploading..." : "Click to change photo"}
        </p>
        {imageError && (
          <p className="text-xs text-red-500">{imageError}</p>
        )}
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-white">Username</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-white">Email</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-white">Bio</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button btnStyle="redOutline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          btnStyle="greenOutline"
          disabled={saving || uploadingImage}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}