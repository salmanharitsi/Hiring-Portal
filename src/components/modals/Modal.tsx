"use client";
import { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({
  open,
  onClose,
  children,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-[1px] p-4"
    >
      <div
        ref={ref}
        className={[
          "w-full max-w-3xl rounded-xl bg-white shadow-xl border border-zinc-200",
          "animate-[fadeIn_.12s_ease-out] data-[state=closed]:animate-none",
          className || "",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
