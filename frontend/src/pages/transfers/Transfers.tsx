import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeftRight, Plus, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import type { Asset, Department, User } from '../../types';

interface TransferRecord {
  _id: string;
  asset: Asset | string;
  fromDepartment: Department | string;
  toDepartment: Department | string;
  toLocation?: string;
  requestedBy: User | string;
  approvedBy?: User | string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason?: string;
  createdAt: string;
}

interface TransferForm {
  asset: string;
  toDepartment: string;
  toLocation: string;
  reason: string;
}

const Transfers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<TransferForm>();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => (await api.get<{ data: TransferRecord[] }>('/transfers?limit=50')).data.data,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets', 'all-for-select'],
    queryFn: async () => (await api.get<{ data: Asset[] }>('/assets?limit=200')).data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get<{ data: Department[] }>('/departments')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: async (values: TransferForm) => (await api.post('/transfers', values)).data,
    onSuccess: () => {
      toast.success('Transfer request submitted');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      reset();
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to request transfer'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.put(`/transfers/${id}`, { status })).data,
    onSuccess: () => {
      toast.success('Transfer updated');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <PageHeader
        title="Asset Transfers"
        subtitle="Request and approve inter-department asset movements"
        action={
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Request Transfer'}
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <select className="input-field" {...register('asset', { required: true })}>
            <option value="">Select asset *</option>
            {assets?.map((a) => (
              <option key={a._id} value={a._id}>{a.name} ({a.assetId})</option>
            ))}
          </select>
          <select className="input-field" {...register('toDepartment', { required: true })}>
            <option value="">Destination department *</option>
            {departments?.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <input className="input-field" placeholder="New location" {...register('toLocation')} />
          <input className="input-field" placeholder="Reason for transfer" {...register('reason')} />
          <button type="submit" className="btn-primary sm:col-span-2">Submit Request</button>
        </form>
      )}

      {isLoading ? (
        <Spinner />
      ) : !transfers?.length ? (
        <EmptyState message="No transfer requests yet" />
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => {
            const asset = t.asset as Asset;
            const from = t.fromDepartment as Department;
            const to = t.toDepartment as Department;
            return (
              <div key={t._id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight size={18} className="text-primary-500" />
                  <div>
                    <p className="text-sm font-medium">{typeof asset === 'object' ? asset.name : ''}</p>
                    <p className="text-xs text-gray-500">
                      {typeof from === 'object' ? from.name : ''} → {typeof to === 'object' ? to.name : ''}
                    </p>
                    {t.reason && <p className="text-xs text-gray-400 mt-0.5">"{t.reason}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  {isAdmin && t.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus.mutate({ id: t._id, status: 'approved' })}
                        className="btn-secondary text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: t._id, status: 'rejected' })}
                        className="text-xs text-red-500 font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isAdmin && t.status === 'approved' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: t._id, status: 'completed' })}
                      className="btn-primary text-xs"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transfers;
