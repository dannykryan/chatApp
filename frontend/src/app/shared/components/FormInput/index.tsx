interface FormInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}

export default function FormInput({ label, type = "text", value, onChange, autoComplete, required }: FormInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-700 rounded bg-woodsmoke text-white"
        required={required}
      />
    </div>
  );
}