import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function generateSessionId(): string {
  const stored = localStorage.getItem("visitorSessionId");
  if (stored) return stored;
  const newId = `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("visitorSessionId", newId);
  return newId;
}

export function VisitorTracker() {
  const [location] = useLocation();
  const lastTrackedPage = useRef<string>("");
  const sessionId = useRef<string>("");

  useEffect(() => {
    sessionId.current = generateSessionId();
    
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId.current,
        page: window.location.pathname,
        referrer: document.referrer || null
      })
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (location === lastTrackedPage.current) return;
    lastTrackedPage.current = location;
    
    if (!sessionId.current) return;
    
    fetch("/api/track/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId.current,
        page: location
      })
    }).catch(() => {});
  }, [location]);

  return null;
}
