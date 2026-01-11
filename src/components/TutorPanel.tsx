"use client";

import React, { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type StickyLike = {
  id: string;
  title?: string;
  text?: string;
  content?: string;
  body?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedStickies: StickyLike[];
  remainingToday: number;
  appName?: string;
};

type Msg = { role: "user" | "assistant"; content: string };

function pickText(s: StickyLike) {
  return (
    s.title ??
    s.text ??
    s.content ??
    s.body ??
    ""
  ).toString();
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default function TutorPanel({
  isOpen,
  onClose,
  selectedStickies,
  remainingToday,
  appName = "Buikecore",
}: Props) {
  const stickyContext = useMemo(() => {
    const lines = (selectedStickies ?? [])
      .map((s, i) => {
        const t = pickText(s).trim();
        if (!t) return null;
        return `(${i + 1}) ${t}`;
      })
      .filter(Boolean) as string[];

    return lines.join("\n");
  }, [selectedStickies]);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string>("");
  const [sending, setSending] = useState(false);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<string>("");

  if (!isOpen) return null;

  async function handleSend(customText?: string) {
    const question = (customText ?? input).trim();
    if (!question) return;

    setSending(true);
    setStatus("");
    setPdfError("");

    const nextMessages: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");

    try {
      let pdfBase64: string | undefined;
      let pdfName: string | undefined;

      if (pdfFile) {
        pdfName = pdfFile.name;
        const buf = await pdfFile.arrayBuffer();
        pdfBase64 = arrayBufferToBase64(buf);
      }

      const bodyData = JSON.stringify({
        question,
        context: stickyContext,
        pdfBase64,
        pdfName,
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyData,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error ||
          `Tutor failed (${res.status})`;
        setStatus(msg);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${msg}` },
        ]);
        return;
      }

      const answer = (data?.answer ?? "").toString();
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      trackEvent("tutor_request", { question });
    } catch (e: any) {
      const msg = e?.message || "Tutor failed to respond";
      setStatus(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setSending(false);
    }
  }

  const quick = [
    { label: "Summarise", text: "Summarise these notes and the PDF (if attached)." },
    { label: "Explain simply", text: "Explain this simply like I'm new to it." },
    { label: "Quiz me", text: "Quiz me on this. Start easy then increase difficulty." },
    { label: "Flashcards", text: "Make flashcards from this content (Q/A format)." },
  ];

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-xl">
          {/* header */}
          <div className="flex items-start justify-between gap-4 p-6">
            <div>
              <div className="text-xs text-white/50">{appName}</div>
              <h2 className="text-4xl font-semibold text-white">Study Tutor</h2>
              <div className="mt-2 text-sm text-white/60">
                Selected: {selectedStickies?.length ?? 0} · Remaining today: {remainingToday}/20
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-2xl bg-white/10 px-6 py-3 text-white hover:bg-white/15"
            >
              Close
            </button>
          </div>

          <div className="h-px bg-white/10" />

          {/* body */}
          <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
            {/* context */}
            <div>
              <div className="text-lg font-semibold text-white/80">
                Context (from your stickies):
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 whitespace-pre-wrap">
                {stickyContext ? stickyContext : "No sticky notes selected."}
              </div>
            </div>

            {/* PDF upload */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-2xl bg-white/10 px-5 py-3 text-white hover:bg-white/15">
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setPdfFile(f);
                    setPdfError("");
                  }}
                />
              </label>

              <button
                type="button"
                className="rounded-2xl bg-white/10 px-5 py-3 text-white hover:bg-white/15 disabled:opacity-50"
                disabled={!pdfFile}
                onClick={() => setPdfFile(null)}
              >
                Clear PDF
              </button>

              <div className="text-white/60">
                {pdfFile ? (
                  <span>
                    Attached: <span className="text-white/80">{pdfFile.name}</span>
                  </span>
                ) : (
                  <span>Attach a PDF to include it in context.</span>
                )}
              </div>

              {pdfError ? (
                <div className="w-full text-sm text-red-300">{pdfError}</div>
              ) : null}
            </div>

            {/* quick actions */}
            <div>
              <div className="text-lg font-semibold text-white/80">Quick actions</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {quick.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setInput(q.text)}
                    className="rounded-2xl bg-white/10 px-6 py-3 text-white hover:bg-white/15"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-white/45">
                Tip: click a button to auto-fill, then hit Send.
              </div>
            </div>

            {/* conversation */}
            <div>
              <div className="text-lg font-semibold text-white/80">Conversation</div>
              <div className="mt-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60">
                    No reply yet. Ask a question and hit Send.
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={[
                        "max-w-[90%] rounded-2xl px-4 py-3 text-white/90 whitespace-pre-wrap",
                        m.role === "user"
                          ? "ml-auto bg-blue-600/90"
                          : "mr-auto bg-white/10 border border-white/10",
                      ].join(" ")}
                    >
                      {m.content}
                    </div>
                  ))
                )}
              </div>

              {status ? (
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  {status}
                </div>
              ) : null}

              {/* input row */}
              <div className="mt-4 flex items-center gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question (follow-ups work)..."
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!sending) handleSend();
                    }
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={sending}
                  className="rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>

              <div className="mt-2 text-xs text-white/40">
                Enter to send. Shift+Enter for a new line.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}