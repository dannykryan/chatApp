"use client";
import { useState } from "react";

const ButtonRound = ({
  onClick,
  children,
  isSelected = false,
  title,
  unread = 0,
  disabled = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  isSelected?: boolean;
  title?: string;
  unread?: number;
  disabled?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // TODO: Add tooltip component */}

  return (
    <div 
      className="relative w-12 h-12"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`
          w-full h-full rounded-full flex items-center justify-center hover:cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""} transition-all
          ${
            isSelected
              ? "bg-purple text-white ring-2 ring-purple ring-offset-2 ring-offset-woodsmoke"
              : "bg-charade text-gray-400 hover:bg-gray-700 hover:text-white"
          }
        `}
      >
        {children}
      </button>

      {!!unread && unread > 0 && (
        <span className="absolute flex items-center justify-center rounded-full bg-purple -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold border-2 border-woodsmoke">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
};

export default ButtonRound;
