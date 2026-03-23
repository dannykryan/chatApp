import { useState, useRef, useEffect } from "react";
import { API_URL } from "../../../shared/utils/api";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";

interface AvatarUploadProps {
  value: string;
  onChange: (url: string) => void;
  token?: string;
  onUploadingChange?: (uploading: boolean) => void;
  type?: "register" | "edit";
}

const instructions = {
  register: "Click to upload an avatar.",
  edit: "Click the avatar to upload a new photo. Max size: 2MB.",
};

export default function AvatarUpload({
  value,
  onChange,
  token,
  onUploadingChange,
  type,
}: AvatarUploadProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => fileInputRef.current?.click();

  useEffect(() => {
    if (onUploadingChange) onUploadingChange(uploadingImage);
  }, [uploadingImage, onUploadingChange]);

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

    // If no token, just show a preview and bubble up the file (for register)
    if (!token) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange(ev.target?.result as string); // send data URL to parent
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_URL}/user/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange(data.profilePictureUrl); // bubble the new URL up to the parent
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={handleImageClick}
        className="relative w-24 h-24 rounded-full cursor-pointer group"
      >
        <Image
          src={
            value ||
            "https://birclqnuxghihsievxtb.supabase.co/storage/v1/object/public/Images/UserAvatars/chatapp-logo.png"
          }
          alt="Profile picture"
          fill
          className="rounded-full object-cover"
        />
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploadingImage ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaCamera className="text-white text-xl" />
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        {uploadingImage ? "Uploading..." : instructions[type || "edit"]}
      </p>
      {imageError && <p className="text-xs text-red-500">{imageError}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
    </div>
  );
}
