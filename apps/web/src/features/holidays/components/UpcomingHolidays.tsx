import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useHolidays } from '../holidays.queries';

function formatHolidayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function UpcomingHolidays() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const { data, isLoading } = useHolidays({
    year,
    sortField: 'date',
    sortDir: 'asc',
    pageSize: 100,
  });

  const thisMonthHolidays = (data?.data ?? []).filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Holidays This Month</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        )}
        {!isLoading && thisMonthHolidays.length === 0 && (
          <p className="text-sm text-muted-foreground">No public holidays this month.</p>
        )}
        {!isLoading && thisMonthHolidays.length > 0 && (
          <ul className="space-y-3">
            {thisMonthHolidays.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{h.name}</p>
                <p className="text-xs text-gray-500 shrink-0">{formatHolidayDate(h.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
