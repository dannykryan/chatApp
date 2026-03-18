"use client";

const ButtonRound = ({ 
  onClick, 
  children,
  isSelected = false,
  title,
}: { 
  onClick?: () => void;
  children: React.ReactNode;
  isSelected?: boolean;
  title?: string;
}) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center transition-all
        ${isSelected
          ? "bg-purple text-white ring-2 ring-purple ring-offset-2 ring-offset-woodsmoke"
          : "bg-charade text-gray-400 hover:text-white hover:bg-purple"
        }
      `}
    >
      {children}
    </button>
  );
};

export default ButtonRound;