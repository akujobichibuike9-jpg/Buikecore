"use client";

import React, { useEffect, useState } from "react";
import { LS_AI_KILL, LS_APP_KILL, readKillSwitch, subscribeKillSwitch } from "@/lib/killSwitch";
import { getAnalyticsSummary } from "@/lib/analytics";

const APP_NAME = "BuikeCore";
const LS_NOTES = "buikecore:notes";

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function RedSwitch({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/[0.06] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-red-200">{label}</div>
          <div className="mt-1 text-sm text-red-200/70">{description}</div>
        </div>
        <div>
          {enabled ? (
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-semibold text-red-200 border border-red-500/30">ACTIVE</span>
          ) : (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 border border-white/10">OFF</span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <button onClick={onToggle} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
          {enabled ? "DISABLE (Restore)" : "ENABLE (Emergency)"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [appKill, setAppKill] = useState(false);
  const [aiKill, setAiKill] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<"app" | "ai" | null>(null);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [serverStats, setServerStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      if (pwTarget === "app") {
        const next = !appKill;
        if (next) {
          localStorage.setItem(LS_APP_KILL, "1");
        } else {
          localStorage.removeItem(LS_APP_KILL);
        }
        window.dispatchEvent(new Event("buikecore:killSwitch"));
      } else {
        const next = !aiKill;
        if (next) {
          localStorage.setItem(LS_AI_KILL, "1");
        } else {
          localStorage.removeItem(LS_AI_KILL);
        }
        window.dispatchEvent(new Event("buikecore:killSwitch"));
      }

      closePw();
    } catch {
      setPwError("Could not verify right now.");
      setPwBusy(false);
    }
  }

  async function refreshStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setServerStats(data?.server ?? null);
    } catch {
      setServerStats(null);
    }

    try {
      const analyticsData = await getAnalyticsSummary();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Analytics error:", err);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    refreshStats();
  }, [appKill, aiKill]);

  const notesCount = (() => {
    try {
      const raw = localStorage.getItem(LS_NOTES) || "[]";
      const notes = JSON.parse(raw);
      return Array.isArray(notes) ? notes.length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-10">
        <header className="mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{APP_NAME} Admin</h1>
              <p className="mt-1 text-sm text-zinc-400">Live analytics and emergency controls</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <div className="text-zinc-400">Status</div>
              <div className="mt-1 flex gap-3">
                <span className={`font-semibold ${appKill ? "text-red-300" : "text-emerald-300"}`}>
                  App: {appKill ? "KILLED" : "RUNNING"}
                </span>
                <span className={`font-semibold ${aiKill ? "text-red-300" : "text-emerald-300"}`}>
                  AI: {aiKill ? "DISABLED" : "ENABLED"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-400">Loading analytics...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Kill Switches */}
            <Card title="Emergency Controls" subtitle="Password-protected kill switches">
              <div className="space-y-4">
                <RedSwitch
                  label="APP KILL SWITCH"
                  description="Blocks entire app (admin still accessible)"
                  enabled={appKill}
                  onToggle={() => openPw("app")}
                />
                <RedSwitch
                  label="AI KILL SWITCH"
                  description="Disables Study Tutor only"
                  enabled={aiKill}
                  onToggle={() => openPw("ai")}
                />
              </div>
            </Card>

            {/* User Analytics */}
            <Card title="User Analytics" subtitle="Live from Supabase">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-2xl font-bold text-white">{analytics?.totalUsers || 0}</div>
                    <div className="mt-1 text-xs text-zinc-400">Total Users</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-2xl font-bold text-emerald-400">{analytics?.usersToday || 0}</div>
                    <div className="mt-1 text-xs text-zinc-400">Today</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-2xl font-bold text-blue-400">{analytics?.usersThisWeek || 0}</div>
                    <div className="mt-1 text-xs text-zinc-400">This Week</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-2xl font-bold text-purple-400">{analytics?.usersThisMonth || 0}</div>
                    <div className="mt-1 text-xs text-zinc-400">This Month</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Stats */}
            <Card title="Activity Stats" subtitle="User actions">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-300">Notes Created</span>
                  <span className="font-semibold text-white">{analytics?.eventsByType?.notesCreated || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-300">Notes Deleted</span>
                  <span className="font-semibold text-white">{analytics?.eventsByType?.notesDeleted || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-300">Tutor Opened</span>
                  <span className="font-semibold text-white">{analytics?.eventsByType?.tutorOpened || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-300">Tutor Requests</span>
                  <span className="font-semibold text-white">{analytics?.eventsByType?.tutorRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <span className="text-sm text-zinc-300">Active Notes</span>
                  <span className="font-semibold text-white">{notesCount}</span>
                </div>
              </div>
            </Card>

            {/* Server Stats */}
            <Card title="Server Info" subtitle="Runtime statistics">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Node Version:</span>
                  <span className="font-mono text-zinc-200">{serverStats?.node || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Environment:</span>
                  <span className="font-mono text-zinc-200">{serverStats?.env || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Uptime:</span>
                  <span className="font-mono text-zinc-200">{serverStats?.uptimeSec ? `${serverStats.uptimeSec}s` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Memory (RSS):</span>
                  <span className="font-mono text-zinc-200">{serverStats?.memoryMB?.rss ? `${serverStats.memoryMB.rss} MB` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Memory (Heap):</span>
                  <span className="font-mono text-zinc-200">{serverStats?.memoryMB?.heapUsed ? `${serverStats.memoryMB.heapUsed} MB` : "—"}</span>
                </div>
              </div>
              <button onClick={refreshStats} className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                Refresh Stats
              </button>
            </Card>

            {/* User Sessions */}
            <Card title="User Sessions" subtitle={`${analytics?.sessions?.length || 0} unique devices`}>
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {analytics?.sessions?.length > 0 ? (
                  analytics.sessions.slice(0, 10).map((session: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-mono text-zinc-300">{session.device_id}</div>
                        <div className="text-zinc-400">
                          {session.browser} on {session.os} ({session.device})
                        </div>
                        <div className="text-zinc-500">IP: {session.ip || "Unknown"}</div>
                        <div className="text-zinc-500">Visits: {session.visits}</div>
                        <div className="text-zinc-500">
                          Last: {new Date(session.last_visit).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-sm text-zinc-400">
                    No sessions tracked yet
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Activity" subtitle="Last 20 events">
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {analytics?.recentEvents?.length > 0 ? (
                  analytics.recentEvents.slice(0, 20).map((event: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-200">{event.type.replace(/_/g, " ")}</span>
                        <span className="text-zinc-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-sm text-zinc-400">
                    No events tracked yet
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Password Modal */}
        {pwOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-100">Admin Password Required</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Confirm to toggle {pwTarget === "app" ? "APP" : "AI"} kill switch
                  </p>
                </div>
                <button onClick={closePw} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10">
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
                  onKeyDown={(e) => e.key === "Enter" && verifyAndToggle()}
                />
                {pwError && <div className="text-sm text-red-300">{pwError}</div>}
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  disabled={pwBusy || pw.length === 0}
                  onClick={verifyAndToggle}
                  className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pwBusy ? "Verifying..." : "Confirm"}
                </button>
                <button onClick={closePw} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}