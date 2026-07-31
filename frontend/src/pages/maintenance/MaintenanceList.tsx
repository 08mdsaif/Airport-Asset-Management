import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import type { Maintenance, Asset, PaginatedResponse } from '../../types';

const MaintenanceList = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', { status, page }],
    queryFn: async () =>
      (await api.get<PaginatedResponse<Maintenance>>('/maintenance', { params: { status, page, limit: 15 } })).data,
  });

  const canManage = user?.role === 'admin' || user?.role === 'supervisor';

  return (
    <div>
      <PageHeader
        title="Maintenance Scheduling"
        subtitle="AI-prioritized maintenance tasks"
        action={
          canManage && (
            <Link to="/maintenance/new" className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Schedule Task
            </Link>
          )
        }
      />

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === s ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.data.length ? (
        <EmptyState message="No maintenance tasks found" />
      ) : (
        <div className="space-y-3">
          {data.data.map((m) => {
            const asset = m.asset as Asset | null;
            const assetName =
              typeof asset === 'object' && asset?.name
                ? asset.name
                : typeof m.asset === 'string'
                ? m.asset
                : 'Unknown asset';

            return (
              <Link
                key={m._id}
                to={`/maintenance/${m._id}`}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{m.title}</p>
                    {m.aiPriorityScore !== undefined && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 text-[10px] text-primary-600 dark:text-primary-400">
                        <Sparkles size={10} /> AI score {m.aiPriorityScore}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {assetName} • Scheduled: {new Date(m.scheduledDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.priority} />
                  <StatusBadge status={m.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {data && data.pagination.total > 15 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">
            Previous
          </button>
          <span className="flex items-center px-2 text-sm">Page {page}</span>
          <button
            disabled={page * 15 >= data.pagination.total}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
