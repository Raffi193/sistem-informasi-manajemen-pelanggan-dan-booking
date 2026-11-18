"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const WIDTH_KEY = "fathan-admin-sidebar-width";
const OLD_COLLAPSED_KEY = "fathan-admin-sidebar-collapsed";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 80;

function snapWidth(value: number) {
  if (value <= 150) return COLLAPSED_WIDTH;
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

function persistWidth(width: number) {
  try {
    window.localStorage.setItem(WIDTH_KEY, String(width));
    window.localStorage.removeItem(OLD_COLLAPSED_KEY);
  } catch {
    // localStorage bisa diblokir browser; abaikan.
  }
}

export function AdminSidebar({ email }: { email: string }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const widthRef = useRef(DEFAULT_WIDTH);
  const lastExpandedWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    try {
      const savedWidth = Number(window.localStorage.getItem(WIDTH_KEY));

      if (Number.isFinite(savedWidth) && savedWidth > 0) {
        const next = snapWidth(savedWidth);
        widthRef.current = next;
        if (next > COLLAPSED_WIDTH) lastExpandedWidth.current = next;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWidth(next);
        return;
      }

      if (window.localStorage.getItem(OLD_COLLAPSED_KEY) === "1") {
        widthRef.current = COLLAPSED_WIDTH;
        setWidth(COLLAPSED_WIDTH);
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia.
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const left = asideRef.current?.getBoundingClientRect().left ?? 0;

    const handleMove = (event: PointerEvent) => {
      const next = snapWidth(event.clientX - left);
      widthRef.current = next;
      if (next > COLLAPSED_WIDTH) lastExpandedWidth.current = next;
      setWidth(next);
    };

    const finishDrag = () => {
      setDragging(false);
      persistWidth(widthRef.current);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging]);

  function updateWidth(next: number, persist = true) {
    const snapped = snapWidth(next);
    widthRef.current = snapped;
    if (snapped > COLLAPSED_WIDTH) lastExpandedWidth.current = snapped;
    setWidth(snapped);
    if (persist) persistWidth(snapped);
  }

  function toggleSidebar() {
    if (widthRef.current <= COLLAPSED_WIDTH) {
      updateWidth(lastExpandedWidth.current);
      return;
    }

    lastExpandedWidth.current = widthRef.current;
    updateWidth(COLLAPSED_WIDTH);
  }

  function startDragging(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  }

  function handleResizeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateWidth(
        widthRef.current <= COLLAPSED_WIDTH
          ? COLLAPSED_WIDTH
          : widthRef.current - 16,
      );
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      updateWidth(
        widthRef.current <= COLLAPSED_WIDTH
          ? lastExpandedWidth.current
          : widthRef.current + 16,
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      updateWidth(MIN_WIDTH);
    } else if (event.key === "End") {
      event.preventDefault();
      updateWidth(MAX_WIDTH);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSidebar();
    }
  }

  const collapsed = width <= COLLAPSED_WIDTH;

  return (
    <aside
      ref={asideRef}
      style={{ width: `${width}px` }}
      className={cn(
        "hidden shrink-0 md:block",
        !dragging && "transition-[width] duration-200",
      )}
    >
      <div className="sticky top-6 rounded-2xl border border-border bg-white p-3">
        <div
          className={cn(
            "flex",
            collapsed
              ? "flex-col items-center gap-2"
              : "items-center justify-between gap-2",
          )}
        >
          <Link
            href="/admin"
            aria-label="Dashboard admin"
            className={cn(
              "flex min-w-0 items-center",
              collapsed && "justify-center",
            )}
          >
            <BrandLogo size={32}>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold leading-tight">
                    Panel Admin
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    LPK CV. Fathan
                  </span>
                </span>
              )}
            </BrandLogo>
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <AdminNav collapsed={collapsed} />

        <div className="mt-5 border-t border-border pt-4">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <span
                title={email}
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
              >
                <UserRound className="size-4" aria-hidden="true" />
                <span className="sr-only">{email}</span>
              </span>
              <AdminLogoutButton variant="icon" />
            </div>
          ) : (
            <>
              <p
                className="truncate px-3 text-xs text-muted-foreground"
                title={email}
              >
                {email}
              </p>
              <div className="mt-2">
                <AdminLogoutButton variant="desktop" />
              </div>
            </>
          )}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Atur lebar sidebar"
          aria-valuemin={COLLAPSED_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          title="Drag untuk mengatur lebar sidebar"
          onPointerDown={startDragging}
          onKeyDown={handleResizeKeyDown}
          onDoubleClick={() => updateWidth(DEFAULT_WIDTH)}
          className={cn(
            "absolute inset-y-4 -right-1 w-2 cursor-col-resize touch-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            dragging ? "bg-primary/50" : "bg-border/70 hover:bg-primary/40",
          )}
        />
      </div>
    </aside>
  );
}