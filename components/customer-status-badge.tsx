import { cn } from "@/lib/utils";
import {
  CUSTOMER_STATUSES,
  type CustomerStatusValue,
} from "@/lib/crm";

const fallbackClassName =
  "bg-slate-100 text-slate-500 ring-slate-500/20";

export function CustomerStatusBadge({
  status,
  className,
}: {
  status: CustomerStatusValue | string;
  className?: string;
}) {
  const style = CUSTOMER_STATUSES.find((item) => item.value === status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        style?.className ?? fallbackClassName,
        className,
      )}
    >
      {style?.label ?? status}
    </span>
  );
}
