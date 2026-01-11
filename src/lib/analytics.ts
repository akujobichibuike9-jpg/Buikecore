import { supabase } from './supabase';

export interface UserSession {
  id?: string;
  session_id: string;
  device_id: string;
  first_visit: string;
  last_visit: string;
  visits: number;
  ip?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  device?: string;
}

export interface AnalyticsEvent {
  id?: string;
  type: 'page_view' | 'note_created' | 'note_deleted' | 'tutor_opened' | 'tutor_request';
  timestamp: string;
  session_id: string;
  device_id: string;
  data?: any;
}

// Generate unique device ID based on browser fingerprint
function generateDeviceId(): string {
  const nav = navigator as any;
  const screen = window.screen;
  
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    !!nav.plugins?.length,
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `device_${Math.abs(hash).toString(36)}`;
}

// Parse user agent for device info
function parseUserAgent(ua: string) {
  const browser = ua.match(/(chrome|safari|firefox|edge|opera)\/?\s*(\d+)/i)?.[1] || 'Unknown';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  let device = 'Desktop';
  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('Tablet')) device = 'Tablet';
  
  return { browser, os, device };
}

// Get or create current session
export async function getCurrentSession(): Promise<UserSession> {
  if (typeof window === 'undefined') {
    return {
      session_id: '',
      device_id: '',
      first_visit: new Date().toISOString(),
      last_visit: new Date().toISOString(),
      visits: 0,
    };
  }
  
  const deviceId = generateDeviceId();
  
  // Check if session exists
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  
  if (existingSession) {
    // Update existing session
    const { data: updatedSession } = await supabase
      .from('user_sessions')
      .update({
        last_visit: new Date().toISOString(),
        visits: existingSession.visits + 1,
      })
      .eq('device_id', deviceId)
      .select()
      .single();
    
    return updatedSession || existingSession;
  } else {
    // Create new session
    const { browser, os, device } = parseUserAgent(navigator.userAgent);
    
    const newSession: Partial<UserSession> = {
      session_id: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      device_id: deviceId,
      first_visit: new Date().toISOString(),
      last_visit: new Date().toISOString(),
      visits: 1,
      user_agent: navigator.userAgent,
      browser,
      os,
      device,
    };
    
    const { data } = await supabase
      .from('user_sessions')
      .insert(newSession)
      .select()
      .single();
    
    return data || newSession as UserSession;
  }
}

// Track an event
export async function trackEvent(type: AnalyticsEvent['type'], data?: any) {
  if (typeof window === 'undefined') return;
  
  const deviceId = generateDeviceId();
  
  // Get current session
  const { data: session } = await supabase
    .from('user_sessions')
    .select('session_id')
    .eq('device_id', deviceId)
    .single();
  
  const event: Partial<AnalyticsEvent> = {
    type,
    timestamp: new Date().toISOString(),
    session_id: session?.session_id || '',
    device_id: deviceId,
    data,
  };
  
  await supabase.from('analytics_events').insert(event);
}

// Get analytics summary
export async function getAnalyticsSummary() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Get all sessions
  const { data: allSessions } = await supabase
    .from('user_sessions')
    .select('*')
    .order('last_visit', { ascending: false });
  
  // Get all events
  const { data: allEvents } = await supabase
    .from('analytics_events')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);
  
  const sessions = allSessions || [];
  const events = allEvents || [];
  
  return {
    totalUsers: sessions.length,
    usersToday: sessions.filter(s => s.last_visit >= oneDayAgo).length,
    usersThisWeek: sessions.filter(s => s.last_visit >= oneWeekAgo).length,
    usersThisMonth: sessions.filter(s => s.last_visit >= oneMonthAgo).length,
    
    totalEvents: events.length,
    eventsToday: events.filter(e => e.timestamp >= oneDayAgo).length,
    eventsThisWeek: events.filter(e => e.timestamp >= oneWeekAgo).length,
    
    eventsByType: {
      pageViews: events.filter(e => e.type === 'page_view').length,
      notesCreated: events.filter(e => e.type === 'note_created').length,
      notesDeleted: events.filter(e => e.type === 'note_deleted').length,
      tutorOpened: events.filter(e => e.type === 'tutor_opened').length,
      tutorRequests: events.filter(e => e.type === 'tutor_request').length,
    },
    
    sessions,
    recentEvents: events,
  };
}