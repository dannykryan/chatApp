import { useState } from "react";

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  "2xl": "w-24 h-24",
  "3xl": "w-32 h-32",
} as const;

type AvatarSize = keyof typeof sizeClasses;

interface RoomAvatarProps {
  label: string;
  imageUrl: string | null;
  isSelected?: boolean;
  onClick?: () => void;
  size?: AvatarSize;
  type: "button" | "avatar";
  unread?: number;
}

function RoomAvatar({ label, imageUrl, isSelected, onClick, size = "md", type = "avatar", unread }: RoomAvatarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  console.log(`Unread: ${unread} for room ${label}`);

  const isButton = type === "button";

  return (
    <div className={`relative flex items-center ${sizeClasses[size]}`}>
      <button
        onClick={isButton ? onClick : undefined}
        onMouseEnter={isButton ? () => setShowTooltip(true) : undefined}
        onMouseLeave={isButton ? () => setShowTooltip(false) : undefined}
        className={`
          w-full h-full rounded-full overflow-hidden shrink-0 transition-all
          ${isButton && (isSelected
            ? "ring-2 ring-purple ring-offset-2 ring-offset-woodsmoke"
            : "hover:ring-2 hover:ring-gray-500 hover:ring-offset-2 hover:ring-offset-woodsmoke"
          )}
        `}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-charade flex items-center justify-center text-white text-xs font-bold ${sizeClasses[size]}`}>
            {label.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="fixed z-9999 left-20 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
          {label}
        </div>
      )}

      {!!unread && unread > 0 && (
        <span className="absolute flex items-center justify-center rounded-full bg-purple -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold border-2 border-woodsmoke">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
}

export default RoomAvatar;