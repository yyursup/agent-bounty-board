import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type Variant = "primary" | "outline" | "quiet" | "inverse";
type Size = "md" | "lg";

type Common = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

function classes({ variant = "primary", size = "md", className }: Omit<Common, "children">) {
  return [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
}

export function Button({
  variant,
  size,
  className,
  children,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={classes({ variant, size, className })}>
      {children}
    </Link>
  );
}
