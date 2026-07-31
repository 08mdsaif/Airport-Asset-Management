import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Spinner, PageHeader, EmptyState } from '../../components/common/Common';
import StatusBadge from '../../components/common/StatusBadge';
import {
  AssetsByDepartmentChart,
  PendingMaintenanceChart,
  MonthlyRepairCostChart,
  AssetUtilizationChart,
  ComplaintTrendsChart,
} from '../../components/charts/DashboardCharts';
import type { Asset, Department } from '../../types';

const Analytics = () => {
  const { data: byDept, isLoading: l1 } = useQuery({
    queryKey: ['analytics', 'assets-by-department'],
    queryFn: async () => (await api.get('/analytics/assets-by-department')).data.data,
  });
  const { data: pending, isLoading: l2 } = useQuery({
    queryKey: ['analytics', 'pending-maintenance'],
    queryFn: async () => (await api.get('/analytics/pending-maintenance')).data.data,
  });
  const { data: critical, isLoading: l3 } = useQuery({
    queryKey: ['analytics', 'critical-assets'],
    queryFn: async () => (await api.get<{ data: Asset[] }>('/analytics/critical-assets')).data.data,
  });
  const { data: cost, isLoading: l4 } = useQuery({
    queryKey: ['analytics', 'monthly-repair-cost'],
    queryFn: async () => (await api.get('/analytics/monthly-repair-cost')).data.data,
  });
  const { data: utilization, isLoading: l5 } = useQuery({
    queryKey: ['analytics', 'asset-utilization'],
    queryFn: async () => (await api.get('/analytics/asset-utilization')).data.data,
  });
  const { data: trends, isLoading: l6 } = useQuery({
    queryKey: ['analytics', 'complaint-trends'],
    queryFn: async () => (await api.get('/analytics/complaint-trends')).data.data,
  });

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deep-dive into asset performance and maintenance trends" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Assets by Department</h3>
          {l1 ? <Spinner /> : <AssetsByDepartmentChart data={byDept} />}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Pending Maintenance</h3>
          {l2 ? <Spinner /> : <PendingMaintenanceChart data={pending} />}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Monthly Repair Cost (Rs.)</h3>
          {l4 ? <Spinner /> : <MonthlyRepairCostChart data={cost} />}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Asset Utilization by Category</h3>
          {l5 ? <Spinner /> : <AssetUtilizationChart data={utilization} />}
        </div>
        <div className="card p-4 lg:col-span-2">
          <h3 className="mb-2 font-semibold text-sm">Complaint Trends</h3>
          {l6 ? <Spinner /> : <ComplaintTrendsChart data={trends} />}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-semibold text-sm">Critical Assets ({critical?.length ?? 0})</h3>
        {l3 ? (
          <Spinner />
        ) : !critical?.length ? (
          <EmptyState message="No critical assets right now" />
        ) : (
          <div className="space-y-2">
            {critical.map((a) => (
              <Link
                key={a._id}
                to={`/assets/${a._id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    {a.assetId} • {typeof a.department === 'object' ? (a.department as Department).name : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={a.status} />
                  <StatusBadge status={a.criticality} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
