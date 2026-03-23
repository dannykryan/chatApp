interface ButtonStyles {
  gray: string;
  primary: string;
  primaryOutline: string;
  redOutline: string;
  green: string;
  greenOutline: string;
  secondary: string;
  danger: string;
  decline: string;
}

const buttonStyles: ButtonStyles = {
  gray: 
    "bg-charade text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200",
  primary:
    "bg-purple text-white hover:bg-purple-dark transition-colors duration-200",
  primaryOutline:
    "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-200",
  redOutline:
    "bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200",
  green:
    "bg-green-600 text-white hover:bg-green-700 transition-colors duration-200",
  greenOutline:
    "bg-transparent border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors duration-200",
  secondary:
    "bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 transition-colors duration-200",
  decline:
    "bg-red-600 text-white hover:bg-red-700 transition-colors duration-200",
};

const Button = ({
  type,
  onClick,
  btnStyle,
  children,
  disabled,
  className,
}: {
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  btnStyle?: keyof ButtonStyles;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${buttonStyles[btnStyle || "gray"]} px-4 py-2 rounded hover:cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""} ${className || ""}`}
    >
      {children || "Click Me"}
    </button>
  );
};

export default Button;
