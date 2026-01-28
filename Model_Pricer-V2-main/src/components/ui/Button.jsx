import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import Icon from "../AppIcon";
import { cn } from "../../utils/cn";

// A small, dependency-light Button component used across the app.
// Many pages/components assume these props exist (asChild, variant, size,
// fullWidth, loading, iconName/icon, iconPosition).

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "ring-offset-background",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        gradient:
          "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const LoadingSpinner = ({ className }) => (
  <span
    className={cn(
      "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
      className
    )}
    aria-hidden="true"
  />
);

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      fullWidth = false,
      loading = false,
      iconName,
      icon,
      iconPosition = "left",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // IMPORTANT: Radix <Slot> requires exactly ONE React element child.
    // Our previous implementation rendered multiple children inside <Slot>
    // (spinner + icon + wrappers), which crashes pages that use <Button asChild>.
    // To keep the app stable, we render a minimal Slot branch that forwards
    // styling/props to the child element and does NOT inject extra wrappers.
    const Comp = asChild ? Slot : "button";
    const isDisabled = Boolean(disabled || loading);

    const resolvedIcon =
      icon ?? (iconName ? <Icon name={iconName} size={16} /> : null);

    const showLeft = resolvedIcon && iconPosition === "left";
    const showRight = resolvedIcon && iconPosition === "right";

    // When asChild=true, we can't rely on the underlying component supporting `disabled`.
    // We keep semantics via aria-disabled and CSS.
    const childDisabledClasses = asChild && isDisabled ? "pointer-events-none opacity-50" : "";

    const baseClassName = cn(
      buttonVariants({ variant, size }),
      fullWidth && "w-full",
      childDisabledClasses,
      className
    );

    if (asChild) {
      // Ensure Slot receives exactly one element.
      const onlyChild = React.Children.only(children);

      return (
        <Comp
          className={baseClassName}
          ref={ref}
          aria-disabled={isDisabled ? "true" : undefined}
          data-loading={loading ? "true" : undefined}
          {...props}
        >
          {onlyChild}
        </Comp>
      );
    }

    return (
      <Comp
        className={baseClassName}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled ? "true" : undefined}
        {...props}
      >
        {loading && iconPosition === "left" && (
          <LoadingSpinner className={children ? "mr-1" : ""} />
        )}

        {!loading && showLeft && <span className="-ml-0.5">{resolvedIcon}</span>}

        <span className={cn(size === "icon" && "leading-none")}>{children}</span>

        {!loading && showRight && <span className="-mr-0.5">{resolvedIcon}</span>}

        {loading && iconPosition === "right" && (
          <LoadingSpinner className={children ? "ml-1" : ""} />
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button, buttonVariants };
