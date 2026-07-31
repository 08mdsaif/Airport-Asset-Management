import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  suffix?: string;
}

const StatCard = ({ label, value, icon: Icon, color = 'primary', suffix }: Props) => {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-500 dark:bg-primary-900/20',
    red: 'bg-red-50 text-red-500 dark:bg-red-900/20',
    yellow: 'bg-yellow-50 text-yellow-500 dark:bg-yellow-900/20',
    green: 'bg-green-50 text-green-500 dark:bg-green-900/20',
  };

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${colorClasses[color] || colorClasses.primary}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
