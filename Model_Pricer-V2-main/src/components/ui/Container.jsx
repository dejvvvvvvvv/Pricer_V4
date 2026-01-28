import React from 'react';
import { cn } from '@/utils/cn'; // Pomůcka pro podmíněné třídy

const Container = ({ children, className }) => {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
};

export default Container;