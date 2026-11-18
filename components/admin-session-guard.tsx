"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Logout otomatis setelah 30 menit tanpa aktivitas di panel admin.
 * Timer di-reset oleh interaksi umum pengguna.
 */
export function AdminSessionGuard() {
  useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;

    const logout = async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        window.location.replace(
          new URL("/login?reason=idle", window.location.origin).toString(),
        );
      }
    };

    const resetTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(logout, IDLE_TIMEOUT_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };

    resetTimer();
    window.addEventListener("pointerdown", resetTimer, { passive: true });
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("touchstart", resetTimer, { passive: true });
    window.addEventListener("scroll", resetTimer, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}