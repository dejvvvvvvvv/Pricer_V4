import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

const Checkbox = React.forwardRef((
  { className, id, label, error, ...props },
  ref
) => {
  const checkboxId = id || React.useId();

  return (
    <div className={cn('relative', className)}>
        <label htmlFor={checkboxId} className={cn("flex items-center space-x-2 cursor-pointer", props.disabled && "cursor-not-allowed opacity-70")}>
            <input
              type="checkbox"
              ref={ref}
              id={checkboxId}
              className="sr-only peer" // Hidden but accessible
              {...props}
            />
            {/* Custom Checkbox */}
            <span
              className={cn(
                'h-4 w-4 shrink-0 rounded-sm border border-primary',
                'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                'peer-checked:bg-primary peer-checked:text-primary-foreground',
                'flex items-center justify-center transition-colors',
                 error && "border-destructive"
              )}
            >
              {/* The check icon appears when checked */}
              <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
            </span>
            
            {/* Label Text */}
            {label && (
               <span className="text-sm font-medium leading-none">
                 {label}
               </span>
            )}
        </label>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
