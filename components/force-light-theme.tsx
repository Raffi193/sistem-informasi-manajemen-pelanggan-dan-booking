"use client";

import { useEffect } from "react";

export function ForceLightTheme() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}