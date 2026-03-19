"use client";
import { usePresence } from "../PresenceProvider";

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  "2xl": "w-24 h-24",
  "3xl": "w-32 h-32",
} as const;

const badgeClasses = {
  sm: "bottom-0 right-0 w-2 h-2 border",
  md: "bottom-0 right-0 w-2.5 h-2.5 border",
  lg: "bottom-0.5 right-0.5 w-3 h-3 border",
  xl: "bottom-1 right-1 w-3.5 h-3.5 border",
  "2xl": "bottom-1.5 right-1.5 w-4 h-4 border-2",
  "3xl": "bottom-2 right-2 w-5 h-5 border-2",
} as const;

const statusClasses = {
  online: "bg-green-500",
  offline: "bg-gray-500",
} as const;

type AvatarSize = keyof typeof sizeClasses;
type AvatarStatus = keyof typeof statusClasses;

export default function Avatar({
  src,
  alt,
  size = "md",
  showStatus = false,
  userId,
}: {
  src?: string;
  alt: string;
  size?: AvatarSize;
  showStatus?: boolean;
  userId?: string;
}) {
  const { isUserOnline } = usePresence();

  const resolvedStatus: AvatarStatus | undefined = userId
    ? isUserOnline(userId)
      ? "online"
      : "offline"
    : undefined;

  const online = userId ? isUserOnline(userId) : undefined;
  console.log(`Avatar ${alt}: userId=${userId}, online=${online}`);

  const textClasses = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-xl",
    "3xl": "text-2xl",
  } as const;

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`rounded-full object-cover ${sizeClasses[size]}`}
        />
      ) : (
        <div
          className={`rounded-full bg-purple flex items-center justify-center text-white font-semibold ${sizeClasses[size]} ${textClasses[size]}`}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
      {showStatus && resolvedStatus && (
        <span
          className={`absolute block rounded-full border-white ${badgeClasses[size]} ${statusClasses[resolvedStatus]} group/status`}
        >
          <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover/status:opacity-100 pointer-events-none whitespace-nowrap z-10">
            {resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1)}
          </span>
        </span>
      )}
    </div>
  );
}
