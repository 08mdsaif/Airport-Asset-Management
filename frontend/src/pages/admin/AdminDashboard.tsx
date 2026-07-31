import { useQuery } from '@tanstack/react-query';
import { Boxes, AlertTriangle, MessageSquareWarning, Wrench } from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import { Spinner, PageHeader } from '../../components/common/Common';
import {
  AssetsByDepartmentChart,
  PendingMaintenanceChart,
  MonthlyRepairCostChart,
  AssetUtilizationChart,
  ComplaintTrendsChart,
} from '../../components/charts/DashboardCharts';

const AdminDashboard = () => {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => (await api.get('/analytics/summary')).data.data,
  });

  const { data: byDept } = useQuery({
    queryKey: ['analytics', 'assets-by-department'],
    queryFn: async () => (await api.get('/analytics/assets-by-department')).data.data,
  });
  const { data: pending } = useQuery({
    queryKey: ['analytics', 'pending-maintenance'],
    queryFn: async () => (await api.get('/analytics/pending-maintenance')).data.data,
  });
  const { data: cost } = useQuery({
    queryKey: ['analytics', 'monthly-repair-cost'],
    queryFn: async () => (await api.get('/analytics/monthly-repair-cost')).data.data,
  });
  const { data: utilization } = useQuery({
    queryKey: ['analytics', 'asset-utilization'],
    queryFn: async () => (await api.get('/analytics/asset-utilization')).data.data,
  });
  const { data: trends } = useQuery({
    queryKey: ['analytics', 'complaint-trends'],
    queryFn: async () => (await api.get('/analytics/complaint-trends')).data.data,
  });

  if (loadingSummary) return <Spinner />;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Airport-wide asset & maintenance overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Assets" value={summary?.totalAssets ?? 0} icon={Boxes} color="primary" />
        <StatCard label="Critical Assets" value={summary?.criticalCount ?? 0} icon={AlertTriangle} color="red" />
        <StatCard label="Open Complaints" value={summary?.openComplaints ?? 0} icon={MessageSquareWarning} color="yellow" />
        <StatCard label="Pending Maintenance" value={summary?.pendingMaintenanceCount ?? 0} icon={Wrench} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Assets by Department</h3>
          {byDept ? <AssetsByDepartmentChart data={byDept} /> : <Spinner />}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Pending Maintenance</h3>
          {pending ? <PendingMaintenanceChart data={pending} /> : <Spinner />}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Monthly Repair Cost (Rs.)</h3>
          {cost ? <MonthlyRepairCostChart data={cost} /> : <Spinner />}
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold text-sm">Asset Utilization by Category</h3>
          {utilization ? <AssetUtilizationChart data={utilization} /> : <Spinner />}
        </div>
        <div className="card p-4 lg:col-span-2">
          <h3 className="mb-2 font-semibold text-sm">Complaint Trends</h3>
          {trends ? <ComplaintTrendsChart data={trends} /> : <Spinner />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
