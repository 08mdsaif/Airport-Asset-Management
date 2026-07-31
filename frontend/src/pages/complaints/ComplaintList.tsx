import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import type { Complaint, PaginatedResponse } from '../../types';

const ComplaintList = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', { status, page }],
    queryFn: async () =>
      (await api.get<PaginatedResponse<Complaint>>('/complaints', { params: { status, page, limit: 15 } })).data,
  });

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle="AI-assisted complaint tracking and resolution"
        action={
          <Link to="/complaints/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> File Complaint
          </Link>
        }
      />

      <div className="mb-4 flex gap-2">
        {['', 'open', 'in_review', 'assigned', 'in_progress', 'resolved', 'closed'].map((s) => (
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
        <EmptyState message="No complaints found" />
      ) : (
        <div className="space-y-3">
          {data.data.map((c) => (
            <Link
              key={c._id}
              to={`/complaints/${c._id}`}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{c.title}</p>
                  {c.aiCategory && (
                    <span className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 text-[10px] text-primary-600 dark:text-primary-400">
                      <Sparkles size={10} /> {c.aiCategory}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{c.complaintId} • {new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.priority} />
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
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

export default ComplaintList;
