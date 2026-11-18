import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  children: React.ReactNode;
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  children,
  size = 32,
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Image
        src="/logo-lpk-fathan.jpg"
        alt="Logo LPK CV. Fathan"
        width={size}
        height={size}
        sizes={`${size}px`}
        priority={priority}
        className="shrink-0 rounded-full object-cover"
      />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
