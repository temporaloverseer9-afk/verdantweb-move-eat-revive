import { cn } from "@/lib/utils";

/**
 * VerdantWeb mark that swaps to a luminous variant in dark mode so it stays
 * visible against the dark surface. Both files are rendered; CSS picks one.
 */
export default function BrandLogo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const shared = cn("object-cover", className);
  return (
    <>
      <img
        src="/verdantweb-logo.png"
        alt="VerdantWeb"
        width={size}
        height={size}
        className={cn(shared, "block dark:hidden")}
      />
      <img
        src="/verdantweb-logo-dark.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={cn(shared, "hidden dark:block")}
      />
    </>
  );
}
