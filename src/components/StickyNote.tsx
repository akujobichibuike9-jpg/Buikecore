"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Sticky } from "@/types/sticky";

type Props = {
  note: Sticky;
  isSelected: boolean;
  selectMode: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onChange: (patch: Partial<Sticky>) => void;
};

export default function StickyNote({
  note,
  isSelected,
  selectMode,
  onToggleSelect,
  onDelete,
  onChange,
}: Props) {
  const [value, setValue] = useState(note.text ?? "");

  useEffect(() => {
    setValue(note.text ?? "");
  }, [note.text]);

  // simple color mapping
  const bg = useMemo(() => {
    if (note.color === "mint") return "bg-emerald-200";
    if (note.color === "lavender") return "bg-purple-200";
    return "bg-amber-200";
  }, [note.color]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const t = e.target.value;
    setValue(t);
    onChange({ text: t });
  }

  return (
    <div
      className={`relative rounded-3xl p-6 shadow-2xl ${bg} ${
        isSelected ? "ring-4 ring-blue-500/70" : "ring-1 ring-black/10"
      }`}
    >
      {/* top-right delete */}
      <button
        onClick={onDelete}
        className="absolute right-4 top-4 rounded-full px-3 py-2 text-black/60 hover:bg-black/10"
        title="Delete"
      >
        ✕
      </button>

      {/* select tick */}
      {selectMode ? (
        <button
          onClick={onToggleSelect}
          className={`absolute left-4 top-4 h-12 w-12 rounded-full flex items-center justify-center font-bold ${
            isSelected ? "bg-blue-600 text-white" : "bg-black/10 text-black/70"
          }`}
          title={isSelected ? "Selected" : "Select"}
        >
          ✓
        </button>
      ) : null}

      {/* text area */}
      <textarea
        value={value}
        onChange={handleTextChange}
        placeholder="New note..."
        className="mt-10 w-full resize-none bg-transparent text-black placeholder:text-black/40 outline-none text-4xl font-semibold leading-tight"
        rows={6}
      />

      <div className="mt-6 text-sm text-black/40 font-medium">Autosaved</div>
    </div>
  );
}
