import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control px-5 py-3 text-sm font-semibold min-h-11 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ea-green disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-ea-green text-white hover:bg-ea-green-dark",
  secondary: "bg-transparent text-ea-evergreen border border-ea-green hover:bg-ea-green/10",
  ghost: "bg-transparent text-ea-muted hover:text-ea-black hover:bg-black/5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />;
});

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
}

/** A Button styled identically but rendered as an anchor, for external/navigational CTAs. */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return <a ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />;
});
