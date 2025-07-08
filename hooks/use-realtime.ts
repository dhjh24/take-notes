"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { setDebugLog } from "@/lib/utils";

export function useRealtime(noteId?: string) {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => {
      setDebugLog("User is online");
      setIsOnline(true);
    };
    const handleOffline = () => {
      setDebugLog("User is offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!noteId) return;

    setDebugLog("Setting up real-time subscription for note:", noteId);
    // Subscribe to real-time changes for the note
    const channel = supabase
      .channel(`note-${noteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `id=eq.${noteId}`,
        },
        (payload) => {
          setDebugLog("Real-time event received:", payload.eventType);
          if (payload.eventType === "UPDATE") {
            toast("This note was updated by another user");
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        setDebugLog("Presence sync event");
        const state = channel.presenceState();
        const users = Object.keys(state);
        setActiveUsers(users);
        setIsConnected(true);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setDebugLog("User joined:", key);
        toast(`${key} is now viewing this note`);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        setDebugLog("User left:", key);
        toast(`${key} stopped viewing this note`);
      })
      .subscribe(async (status) => {
        setDebugLog("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          // Track presence
          await channel.track({
            user_id: "current-user", // Replace with actual user ID
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      setDebugLog("Cleaning up real-time subscription for note:", noteId);
      supabase.removeChannel(channel);
    };
  }, [noteId, supabase, toast]);

  return {
    isOnline,
    isConnected,
    activeUsers,
  };
}
