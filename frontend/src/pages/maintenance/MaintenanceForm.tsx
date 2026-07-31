import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { PageHeader } from '../../components/common/Common';
import type { Asset, User } from '../../types';

interface MaintenanceFormValues {
  asset: string;
  type: string;
  title: string;
  description: string;
  scheduledDate: string;
  assignedTo: string;
}

const MaintenanceForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormValues>();

  // Supports being launched from a Complaint's "Schedule Maintenance" button,
  // which pre-fills the asset and links the new task back to that complaint.
  const complaintId = searchParams.get('complaintId');
  const preselectedAssetId = searchParams.get('assetId');

  const { data: assets } = useQuery({
    queryKey: ['assets', 'all-for-select'],
    queryFn: async () => (await api.get<{ data: Asset[] }>('/assets?limit=200')).data.data,
  });

  const { data: staff } = useQuery({
    queryKey: ['users', 'staff-for-assign'],
    queryFn: async () => (await api.get<{ data: User[] }>('/users?limit=100')).data.data,
  });

  useEffect(() => {
    if (preselectedAssetId) {
      reset((prev) => ({ ...prev, asset: preselectedAssetId }));
    }
  }, [preselectedAssetId, reset]);

  const onSubmit = async (values: MaintenanceFormValues) => {
    setLoading(true);
    try {
      const { data } = await api.post('/maintenance', {
        ...values,
        linkedComplaint: complaintId || undefined,
      });
      toast.success('Maintenance task scheduled — AI priority prediction applied');
      navigate(`/maintenance/${data.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Schedule Maintenance"
        subtitle={
          complaintId
            ? 'Linked to a complaint — resolving this task will auto-resolve the complaint'
            : 'AI will predict priority based on asset criticality & history'
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Asset *</label>
          <select className="input-field" defaultValue={preselectedAssetId || ''} {...register('asset', { required: true })}>
            <option value="">Select asset</option>
            {assets?.map((a) => (
              <option key={a._id} value={a._id}>{a.name} ({a.assetId})</option>
            ))}
          </select>
          {errors.asset && <p className="mt-1 text-xs text-red-500">Asset is required</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Maintenance Type</label>
          <select className="input-field" {...register('type')}>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="predictive">Predictive</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input className="input-field" placeholder="e.g. Quarterly HVAC filter replacement" {...register('title', { required: true })} />
          {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea rows={4} className="input-field" {...register('description')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Scheduled Date *</label>
          <input type="date" className="input-field" {...register('scheduledDate', { required: true })} />
          {errors.scheduledDate && <p className="mt-1 text-xs text-red-500">Scheduled date is required</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Assign To</label>
          <select className="input-field" {...register('assignedTo')}>
            <option value="">Unassigned</option>
            {staff?.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Scheduling...' : 'Schedule Task'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
