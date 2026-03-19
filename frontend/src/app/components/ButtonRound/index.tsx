"use client";

const ButtonRound = ({
  onClick,
  children,
  isSelected = false,
  title,
  unread = 0,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  isSelected?: boolean;
  title?: string;
  unread?: number;
}) => {
  return (
    <div className="relative w-12 h-12">
      <button
        onClick={onClick}
        title={title}
        className={`
          w-full h-full rounded-full flex items-center justify-center transition-all
          ${
            isSelected
              ? "bg-purple text-white ring-2 ring-purple ring-offset-2 ring-offset-woodsmoke"
              : "bg-charade text-gray-400 hover:text-white hover:bg-purple"
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
