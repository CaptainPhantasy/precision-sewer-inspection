'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** Preserve the existing wrapper's focus prop while using DayPicker's new API. */
  initialFocus?: boolean;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  initialFocus,
  autoFocus = initialFocus,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      autoFocus={autoFocus}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex h-7 justify-center relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'absolute inset-x-0 top-0 z-10 flex items-center justify-between',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 aria-disabled:pointer-events-none'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 aria-disabled:pointer-events-none'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative aria-selected:bg-accent first:aria-selected:rounded-l-md last:aria-selected:rounded-r-md [&.range-start]:rounded-l-md [&.range-end]:rounded-r-md focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal'
        ),
        range_start: 'range-start',
        range_end: 'range-end',
        selected:
          '[&:not(.range-middle)>button]:bg-primary [&:not(.range-middle)>button]:text-primary-foreground [&:not(.range-middle)>button:hover]:bg-primary [&:not(.range-middle)>button:focus]:bg-primary',
        today: '[&:not([aria-selected])>button]:bg-accent [&:not([aria-selected])>button]:text-accent-foreground',
        outside: 'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'range-middle [&>button]:bg-accent [&>button]:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation = 'left', style }) => {
          const Icon = { left: ChevronLeft, right: ChevronRight, up: ChevronUp, down: ChevronDown }[orientation];
          return <Icon aria-hidden="true" className={cn('h-4 w-4', className)} style={style} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
