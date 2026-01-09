"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LS_AI_KILL, LS_APP_KILL, readKillSwitch, subscribeKillSwitch } from "@/lib/killSwitch";

const APP_NAME = "BuikeCore";

// Stats localStorage keys
const LS_NOTES = "buikecore:notes";
const LS_TUTOR_COUNT = "buikecore:stats:tutor_requests";
const LS_TUTOR_LAST = "buikecore:stats:tutor_last";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function RedSwitch({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/[0.06] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-red-200">{label}</div>
          <div className="mt-1 text-sm text-red-200/70">{description}</div>
        </div>

        <div>
          {enabled ? (
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-semibold text-red-200 border border-red-500/30">
              ACTIVE
            </span>
          ) : (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 border border-white/10">
              OFF
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={onToggle}
          className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          {enabled ? "DISABLE (Restore)" : "ENABLE (Emergency)"}
        </button>
      </div>
    </div>
  );
}

export default function AdminClient() {
  const [appKill, setAppKill] = useState(false);
  const [aiKill, setAiKill] = useState(false);

  // password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<"app" | "ai" | null>(null);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // stats
  const [serverStats, setServerStats] = useState<any>(null);
  const [clientStats, setClientStats] = useState<any>(null);

  useEffect(() => {
    const sync = () => {
      setAppKill(readKillSwitch(LS_APP_KILL));
      setAiKill(readKillSwitch(LS_AI_KILL));
    };
    sync();
    return subscribeKillSwitch(sync);
  }, []);

  function openPw(target: "app" | "ai") {
    setPw("");
    setPwError(null);
    setPwTarget(target);
    setPwOpen(true);
  }

  function closePw() {
    setPwOpen(false);
    setPw("");
    setPwError(null);
    setPwTarget(null);
    setPwBusy(false);
  }

  async function verifyAndToggle() {
    if (!pwTarget) return;
    setPwBusy(true);
    setPwError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setPwError("Wrong password.");
        setPwBusy(false);
        return;
      }

      // toggle
      if (pwTarget === "app") {
        const next = !appKill;
        localStorage.setItem(LS_APP_KILL, next ? "1" : "0");
        window.dispatchEvent(new Event("buikecore:killSwitch"));
      } else {
        const next = !aiKill;
        localStorage.setItem(LS_AI_KILL, next ? "1" : "0");
        window.dispatchEvent(new Event("buikecore:killSwitch"));
      }

      closePw();
    } catch {
      setPwError("Could not verify right now.");
      setPwBusy(false);
    }
  }

  function refreshClientStats() {
    try {
      const notesRaw = localStorage.getItem(LS_NOTES) || "[]";
      const notes = JSON.parse(notesRaw);
      const notesCount = Array.isArray(notes) ? notes.length : 0;

      const bytes =
        Object.keys(localStorage).reduce((sum, k) => {
          const v = localStorage.getItem(k) ?? "";
          return sum + k.length + v.length;
        }, 0) * 2;

      const tutorCount = Number(localStorage.getItem(LS_TUTOR_COUNT) || "0");
      const tutorLast = Number(localStorage.getItem(LS_TUTOR_LAST) || "0");

      setClientStats({
        notesCount,
        storageKB: Math.round(bytes / 1024),
        tutorCount,
        tutorLast: tutorLast ? new Date(tutorLast).toLocaleString() : "—",
        appKill,
        aiKill,
      });
    } catch {
      setClientStats(null);
    }
  }

  async function refreshServerStats() {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setServerStats(data?.server ?? null);
    } catch {
      setServerStats(null);
    }
  }

  useEffect(() => {
    refreshClientStats();
    refreshServerStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKill, aiKill]);

  const status = useMemo(
    () => ({
      app: appKill ? "KILLED" : "RUNNING",
      ai: aiKill ? "DISABLED" : "ENABLED",
    }),
    [appKill, aiKill]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{APP_NAME} Admin</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Kill switches are reversible and password protected.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <div className="text-zinc-400">Status</div>
            <div className="mt-1 flex gap-3">
              <span className={`font-semibold ${appKill ? "text-red-300" : "text-emerald-300"}`}>
                App: {status.app}
              </span>
              <span className={`font-semibold ${aiKill ? "text-red-300" : "text-emerald-300"}`}>
                AI: {status.ai}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Kill Switches" subtitle="Emergency switches (local to this browser for now).">
          <div className="space-y-4">
            <RedSwitch
              label="APP KILL SWITCH"
              description="Blocks the main app UI (admin still accessible)."
              enabled={appKill}
              onToggle={() => openPw("app")}
            />

            <RedSwitch
              label="AI KILL SWITCH"
              description="Disables the Study Tutor only."
              enabled={aiKill}
              onToggle={() => openPw("ai")}
            />

            <p className="text-xs text-zinc-400">
              Next when we “go live”, we’ll move these switches to server storage so they affect everyone.
            </p>
          </div>
        </Card>

        <Card title="Real Stats" subtitle="Client + server diagnostics (refresh anytime).">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                refreshClientStats();
                refreshServerStats();
              }}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Refresh stats
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <div className="font-semibold text-zinc-200">Client</div>
              <div className="mt-2 text-zinc-300 space-y-1">
                <div>Notes saved: <span className="font-semibold">{clientStats?.notesCount ?? "—"}</span></div>
                <div>localStorage size: <span className="font-semibold">{clientStats?.storageKB ?? "—"} KB</span></div>
                <div>Tutor opens: <span className="font-semibold">{clientStats?.tutorCount ?? "—"}</span></div>
                <div>Last tutor open: <span className="font-semibold">{clientStats?.tutorLast ?? "—"}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <div className="font-semibold text-zinc-200">Server</div>
              <div className="mt-2 text-zinc-300 space-y-1">
                <div>Node: <span className="font-semibold">{serverStats?.node ?? "—"}</span></div>
                <div>Env: <span className="font-semibold">{serverStats?.env ?? "—"}</span></div>
                <div>Uptime: <span className="font-semibold">{serverStats?.uptimeSec ?? "—"}s</span></div>
                <div>
                  Memory (MB):{" "}
                  <span className="font-semibold">
                    RSS {serverStats?.memoryMB?.rss ?? "—"} / Heap {serverStats?.memoryMB?.heapUsed ?? "—"}
                  </span>
                </div>
                <div>Server time: <span className="font-semibold">{serverStats?.time ?? "—"}</span></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Password Modal */}
      {pwOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-zinc-100">Admin password required</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Confirm to toggle {pwTarget === "app" ? "APP kill switch" : "AI kill switch"}.
                </p>
              </div>
              <button
                onClick={closePw}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm text-zinc-300">Password</label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                type="password"
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-white/20"
                placeholder="Enter admin password"
              />
              {pwError ? <div className="text-sm text-red-300">{pwError}</div> : null}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                disabled={pwBusy || pw.length === 0}
                onClick={verifyAndToggle}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
              <button
                onClick={closePw}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Uses <code className="rounded bg-white/5 px-1">ADMIN_PASSWORD</code> from{" "}
              <code className="rounded bg-white/5 px-1">.env.local</code>.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
