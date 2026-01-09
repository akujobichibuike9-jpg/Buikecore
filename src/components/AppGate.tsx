"use client";

import { useEffect, useState } from "react";
import { isAppKilled, subscribeKillSwitch } from "@/lib/killSwitch";
import Splash from "./Splash";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const [killed, setKilled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setKilled(isAppKilled());
    sync();
    const timer = setTimeout(() => setLoading(false), 1500);
    const unsub = subscribeKillSwitch(sync);
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  if (loading) return <Splash />;

  if (killed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-3xl font-bold text-red-300">BuikeCore is temporarily disabled</h1>
          <p className="mt-3 text-sm text-red-200/80">The admin has paused the app. This is not permanent.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="/admin" className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500">Go to Admin</a>
            <button onClick={() => window.location.reload()} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10">Refresh</button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}