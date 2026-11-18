"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/admin/actions";
import { Spinner } from "@/components/spinner";

function LogoutSubmit({ variant }: { variant: "mobile" | "desktop" }) {
  const { pending } = useFormStatus();
  const className =
    variant === "mobile"
      ? "inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      : "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? (
        <Spinner className="size-4" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      {pending ? "Logging out…" : "Logout"}
    </button>
  );
}

export function AdminLogoutButton({
  variant = "desktop",
}: {
  variant?: "mobile" | "desktop";
}) {
  return (
    <form action={signOutAction}>
      <LogoutSubmit variant={variant} />
    </form>
  );
}