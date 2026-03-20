"use client";
import { createContext, useContext, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../Button";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: ComponentProps<typeof Button>["btnStyle"];
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmContextType>(null!);

export const ConfirmProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<(value: boolean) => void>(null!);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleClose = (result: boolean) => {
    resolverRef.current(result);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => handleClose(false)}
        >
          <div
            className="bg-woodsmoke border border-gray-700 rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {options.title}
              </h2>
              <button
                onClick={() => handleClose(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Message */}
            <p className="text-gray-300 text-sm">{options.message}</p>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-2">
              <Button
                btnStyle="gray"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                btnStyle={options.confirmStyle ?? "primary"}
                onClick={() => handleClose(true)}
              >
                {options.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
