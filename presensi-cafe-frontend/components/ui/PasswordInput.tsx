"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

/** Input password dengan ikon mata untuk melihat/menyembunyikan isinya. Gaya sama dengan Input biasa. */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const [tampil, setTampil] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={tampil ? "text" : "password"}
            className={`w-full rounded-lg border border-border bg-surface py-2.5 pl-3.5 pr-11 text-sm text-ink placeholder:text-muted/70 focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/20 ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setTampil((t) => !t)}
            aria-label={tampil ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={tampil}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted transition-colors hover:text-ink"
          >
            {tampil ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
