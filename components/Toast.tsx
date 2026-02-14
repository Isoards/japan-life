"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (text: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const seqRef = useRef(0);

  const toast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    seqRef.current += 1;
    const id = Date.now() * 1000 + (seqRef.current % 1000);
    setMessages((prev) => [...prev, { id, text, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none">
        {messages.map((msg) => (
          <ToastItem key={msg.id} message={msg} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(message.id), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [message.id, onDismiss]);

  const colors = {
    success: "bg-emerald-500/90 text-white",
    error: "bg-red-500/90 text-white",
    info: "bg-blue-500/90 text-white",
  };

  const icons = { success: "\u2713", error: "\u2717", info: "\u2139" };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${colors[message.type]} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      <span>{icons[message.type]}</span>
      <span>{message.text}</span>
    </div>
  );
}
