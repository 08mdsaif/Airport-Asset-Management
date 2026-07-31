import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const PALETTE = ['#0b5394', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9ca3af' } } },
  scales: undefined as any,
};

export const AssetsByDepartmentChart = ({ data }: { data: { department: string; count: number }[] }) => (
  <div className="h-72">
    <Pie
      data={{
        labels: data.map((d) => d.department),
        datasets: [{ data: data.map((d) => d.count), backgroundColor: PALETTE }],
      }}
      options={commonOptions}
    />
  </div>
);

export const PendingMaintenanceChart = ({ data }: { data: { status: string; count: number }[] }) => (
  <div className="h-72">
    <Bar
      data={{
        labels: data.map((d) => d.status.replace('_', ' ')),
        datasets: [{ label: 'Pending Tasks', data: data.map((d) => d.count), backgroundColor: '#f59e0b' }],
      }}
      options={{
        ...commonOptions,
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af' }, beginAtZero: true },
        },
      }}
    />
  </div>
);

export const MonthlyRepairCostChart = ({ data }: { data: { label: string; totalCost: number }[] }) => (
  <div className="h-72">
    <Line
      data={{
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Repair Cost (Rs.)',
            data: data.map((d) => d.totalCost),
            borderColor: '#0b5394',
            backgroundColor: 'rgba(11,83,148,0.15)',
            fill: true,
            tension: 0.35,
          },
        ],
      }}
      options={{
        ...commonOptions,
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af' }, beginAtZero: true },
        },
      }}
    />
  </div>
);

export const AssetUtilizationChart = ({ data }: { data: { category: string; avgUtilization: number }[] }) => (
  <div className="h-72">
    <Bar
      data={{
        labels: data.map((d) => d.category),
        datasets: [{ label: 'Avg Utilization %', data: data.map((d) => d.avgUtilization), backgroundColor: '#10b981' }],
      }}
      options={{
        ...commonOptions,
        indexAxis: 'y' as const,
        scales: {
          x: { ticks: { color: '#9ca3af' }, beginAtZero: true, max: 100 },
          y: { ticks: { color: '#9ca3af' }, grid: { display: false } },
        },
      }}
    />
  </div>
);

export const ComplaintTrendsChart = ({ data }: { data: { label: string; raised: number; resolved: number }[] }) => (
  <div className="h-72">
    <Line
      data={{
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Raised',
            data: data.map((d) => d.raised),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            tension: 0.35,
          },
          {
            label: 'Resolved',
            data: data.map((d) => d.resolved),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.35,
          },
        ],
      }}
      options={{
        ...commonOptions,
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af' }, beginAtZero: true },
        },
      }}
    />
  </div>
);
