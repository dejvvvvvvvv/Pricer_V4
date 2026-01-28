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
                >
                    {label}
                </label>
            )}
            <input
                type={type}
                id={inputId}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus-visible:ring-destructive",
                    className
                )}
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
