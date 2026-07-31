interface Props {
  status: string;
}

const colorMap: Record<string, string> = {
  // asset status
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  under_maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  decommissioned: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  // complaint/maintenance status
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  assigned: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  // priority/severity/criticality
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const StatusBadge = ({ status }: Props) => {
  const classes = colorMap[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return <span className={`badge ${classes}`}>{status?.replace(/_/g, ' ')}</span>;
};

export default StatusBadge;
