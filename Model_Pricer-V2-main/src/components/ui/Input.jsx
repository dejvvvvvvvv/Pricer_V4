import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(({
    className,
    type = "text",
    label,
    error,
    ...props
}, ref) => {

    const inputId = props.id || `input-${React.useId()}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "block text-sm font-medium mb-1",
                        error ? "text-destructive" : "text-foreground"
                    )}
                    style={{ color: error ? 'var(--forge-error)' : 'var(--forge-text-secondary, inherit)' }}
                >
                    {label}
                </label>
            )}
            <input
                type={type}
                id={inputId}
                className={cn(
                    "flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus-visible:ring-destructive",
                    className
                )}
                style={{
                    backgroundColor: 'var(--forge-bg-elevated, hsl(0 0% 3.9%))',
                    color: 'var(--forge-text-primary, #fff)',
                    borderColor: error ? 'var(--forge-error)' : 'var(--forge-border-default, hsl(0 0% 14.9%))',
                    fontFamily: 'var(--forge-font-body, inherit)',
                    ...(props.style || {}),
                }}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
