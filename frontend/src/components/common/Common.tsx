import { Inbox } from 'lucide-react';

export const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
  </div>
);

export const EmptyState = ({ message = 'No data found' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <Inbox size={40} />
    <p className="mt-2 text-sm">{message}</p>
  </div>
);

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="text-xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
    {action}
  </div>
);
