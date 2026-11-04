import { cn } from "@/lib/utils";
import { followUpClassName, followUpLabel } from "@/lib/crm";

export function FollowUpTypeBadge({
  jenis,
  className,
}: {
  jenis: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        followUpClassName(jenis),
        className,
      )}
    >
      {followUpLabel(jenis)}
    </span>
  );
}
