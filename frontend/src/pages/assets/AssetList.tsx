import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, QrCode } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import type { Asset, PaginatedResponse } from '../../types';

const AssetList = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', { search, status, category, page }],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<Asset>>('/assets', {
          params: { search, status, category, page, limit: 12 },
        })
      ).data,
  });

  const canManage = user?.role === 'admin' || user?.role === 'supervisor';

  return (
    <div>
      <PageHeader
        title="Asset Management"
        subtitle="Track and manage all airport assets"
        action={
          canManage && (
            <Link to="/assets/new" className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Asset
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            className="input-field pl-9"
            placeholder="Search by name, ID, serial number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="critical">Critical</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
        <select className="input-field w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {[
            'Baggage Handling',
            'Escalator/Elevator',
            'HVAC',
            'Electrical',
            'Ground Support Equipment',
            'IT/Networking',
            'Fire Safety',
            'Runway/Airfield',
            'Furniture',
            'Other',
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.data.length ? (
        <EmptyState message="No assets found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((asset) => (
            <Link key={asset._id} to={`/assets/${asset._id}`} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.assetId}</p>
                </div>
                {asset.qrCodeUrl && <QrCode size={18} className="text-gray-400" />}
              </div>
              <p className="mt-2 text-xs text-gray-500">{asset.category}</p>
              <p className="text-xs text-gray-500">📍 {asset.location || 'N/A'}</p>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={asset.status} />
                <StatusBadge status={asset.criticality} />
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-1.5 rounded-full bg-primary-500"
                  style={{ width: `${asset.utilization}%` }}
                  title={`Utilization: ${asset.utilization}%`}
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.pagination.total > 12 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-2 text-sm">Page {page}</span>
          <button
            disabled={page * 12 >= data.pagination.total}
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

export default AssetList;
