"use client"

import React, { useState, useEffect } from "react";
import { useNotifications } from "./notification-system";

export interface FontSelectorProps {
  value?: string;
  onChange: (font: string) => void;
}

export default function FontSelector({ value = "", onChange }: FontSelectorProps) {
  const [fonts, setFonts] = useState<string[]>([]);
  const { showError } = useNotifications();

  useEffect(() => {
    fetch("/api/fonts")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load fonts");
        setFonts(data.families);
      })
      .catch((err: Error) => {
        showError("Font list error", err.message);
      });
  }, [showError]);

  const loadFont = (font: string) => {
    const linkId = `google-font-${font.replace(/\s+/g, "-")}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`;
    link.onerror = () => {
      showError("Font load error", `Failed to load font: ${font}`);
    };
    document.head.appendChild(link);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    if (!font) return;
    onChange(font);
    loadFont(font);
  };

  return (
    <select
      className="p-2 border rounded w-full"
      aria-label="Font selector"
      value={value}
      onChange={handleChange}
    >
      <option value="" disabled>
        Select a font
      </option>
      {fonts.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}
