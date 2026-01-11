"use client";

import React, { useEffect, useMemo, useState } from "react";
import StickyNote from "./StickyNote";
import TutorPanel from "./TutorPanel";
import type { Sticky } from "@/types/sticky";
import { trackEvent } from "@/lib/analytics";
import { readKillSwitch, subscribeKillSwitch, LS_AI_KILL } from "@/lib/killSwitch";

const LS_NOTES = "buikecore:notes";
const LS_TUTOR_COUNT = "buikecore:stats:tutor_requests";
const LS_TUTOR_LAST = "buikecore:stats:tutor_last";

function loadNotes(): Sticky[] {
  try {
    const raw = localStorage.getItem(LS_NOTES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Sticky[]) {
  localStorage.setItem(LS_NOTES, JSON.stringify(notes));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function StickyGrid() {
  const [notes, setNotes] = useState<Sticky[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [aiKilled, setAiKilled] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (notes.length === 0) return;
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    const sync = () => {
      const killed = readKillSwitch(LS_AI_KILL);
      console.log('🔍 AI Kill Switch Check:', killed); // DEBUG
      setAiKilled(killed);
    };
    
    sync(); // Initial check
    
    const unsub = subscribeKillSwitch(() => {
      console.log('🔔 Kill switch event triggered!'); // DEBUG
      sync();
    });
    
    return unsub;
  }, []);

  const selectedStickies = useMemo(
    () => notes.filter((n) => selectedIds.includes(n.id)),
    [notes, selectedIds]
  );

  function addNote() {
    const next: Sticky = {
      id: uid(),
      text: "",
      color: Math.random() > 0.5 ? "mint" : "lavender",
      updatedAt: Date.now(),
    };
    setNotes((prev) => [next, ...prev]);
    trackEvent("note_created");
  }

  function updateNote(id: string, patch: Partial<Sticky>) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    trackEvent("note_deleted");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearAll() {
    setNotes([]);
    setSelectedIds([]);
    setSelectMode(false);
    setTutorOpen(false);
  }

  function openTutor() {
    console.log('🎯 Opening tutor, AI killed?', aiKilled); // DEBUG
    
    if (aiKilled) {
      alert("❌ The Study Tutor has been disabled by the admin.");
      return;
    }

    if (selectedIds.length === 0) return;

    // stats
    const count = Number(localStorage.getItem(LS_TUTOR_COUNT) || "0") + 1;
    localStorage.setItem(LS_TUTOR_COUNT, String(count));
    localStorage.setItem(LS_TUTOR_LAST, String(Date.now()));

    trackEvent("tutor_opened");
    setTutorOpen(true);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        <div className="text-sm text-white/60">{notes.length} notes</div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={addNote}
            className="rounded-2xl bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90"
          >
            + Add note
          </button>

          <button
            onClick={() => setSelectMode((v) => !v)}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            {selectMode ? "Exit Select" : "Select"}
          </button>

          <button
            onClick={clearAll}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Clear
          </button>

          <button
            disabled={aiKilled || selectedIds.length === 0}
            onClick={openTutor}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition
              ${aiKilled || selectedIds.length === 0
                ? "bg-blue-600/30 text-white/60 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            title={
              aiKilled 
                ? "Tutor disabled by admin" 
                : selectedIds.length === 0 
                ? "Select at least 1 note" 
                : "Open tutor"
            }
          >
            Ask Tutor {aiKilled && '🔒'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <StickyNote
            key={n.id}
            note={n}
            isSelected={selectedIds.includes(n.id)}
            selectMode={selectMode}
            onToggleSelect={() => toggleSelect(n.id)}
            onDelete={() => deleteNote(n.id)}
            onChange={(patch) => updateNote(n.id, patch)}
          />
        ))}
      </div>

      {/* Tutor */}
      <TutorPanel
        isOpen={tutorOpen}
        onClose={() => setTutorOpen(false)}
        selectedStickies={selectedStickies}
        remainingToday={20}
      />
    </main>
  );
}