"use client";

import { useEffect } from "react";
import { getCurrentSession, trackEvent } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

export default function AnalyticsTracker() {
  useEffect(() => {
    async function init() {
      try {
        // Get IP from server
        const res = await fetch("/api/analytics/visit", {
          method: "POST",
        });
        
        if (res.ok) {
          const data = await res.json();
          const session = await getCurrentSession();
          
          // Update session with IP
          if (data.ip && session.device_id) {
            await supabase
              .from('user_sessions')
              .update({ ip: data.ip })
              .eq('device_id', session.device_id);
          }
        }
        
        // Track page view
        await trackEvent("page_view");
      } catch (err) {
        console.error("Analytics init error:", err);
      }
    }
    
    init();
  }, []);
  
  return null;
}