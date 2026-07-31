import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { PageHeader } from '../../components/common/Common';
import type { Department, Asset, User } from '../../types';

interface AssetFormValues {
  name: string;
  category: string;
  department: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry: string;
  criticality: string;
  utilization: number;
  assignedTo: string;
  notes: string;
}

const categories = [
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
];

const AssetForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetFormValues>();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get<{ data: Department[] }>('/departments')).data.data,
  });

  const { data: staff } = useQuery({
    queryKey: ['users', 'staff-for-assign'],
    queryFn: async () => (await api.get<{ data: User[] }>('/users?limit=100')).data.data,
  });

  useEffect(() => {
    if (isEdit) {
      api.get<{ data: Asset }>(`/assets/${id}`).then(({ data }) => {
        const a = data.data;
        reset({
          name: a.name,
          category: a.category,
          department: typeof a.department === 'object' ? a.department._id : a.department,
          location: a.location,
          manufacturer: a.manufacturer,
          model: a.model,
          serialNumber: a.serialNumber,
          purchaseDate: a.purchaseDate?.slice(0, 10),
          purchaseCost: a.purchaseCost,
          warrantyExpiry: a.warrantyExpiry?.slice(0, 10),
          criticality: a.criticality,
          utilization: a.utilization,
          assignedTo: typeof a.assignedTo === 'object' ? (a.assignedTo as any)?._id : a.assignedTo,
          notes: a.notes,
        } as any);
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (values: AssetFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') formData.append(k, String(v));
      });
      // Explicitly send an empty assignedTo when "Unassigned" is chosen during an edit,
      // so the backend can clear the field rather than silently ignoring it.
      if (isEdit && !values.assignedTo) formData.append('assignedTo', '');
      if (imageFile) formData.append('image', imageFile);

      if (isEdit) {
        await api.put(`/assets/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Asset updated');
        navigate(`/assets/${id}`);
      } else {
        const { data } = await api.post('/assets', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Asset created with QR code generated');
        navigate(`/assets/${data.data._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={isEdit ? 'Edit Asset' : 'Add New Asset'} subtitle="A QR code will be auto-generated for new assets" />

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Asset Name *</label>
            <input className="input-field" {...register('name', { required: true })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">Name is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category *</label>
            <select className="input-field" {...register('category', { required: true })}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Department *</label>
            <select className="input-field" {...register('department', { required: true })}>
              <option value="">Select department</option>
              {departments?.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <input className="input-field" placeholder="e.g. Terminal 2, Gate 14" {...register('location')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Manufacturer</label>
            <input className="input-field" {...register('manufacturer')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            <input className="input-field" {...register('model')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Serial Number</label>
            <input className="input-field" {...register('serialNumber')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Criticality</label>
            <select className="input-field" {...register('criticality')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Purchase Date</label>
            <input type="date" className="input-field" {...register('purchaseDate')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Purchase Cost (Rs.)</label>
            <input type="number" className="input-field" {...register('purchaseCost')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Warranty Expiry</label>
            <input type="date" className="input-field" {...register('warrantyExpiry')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Utilization (%)</label>
            <input type="number" min={0} max={100} className="input-field" {...register('utilization')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Assigned To</label>
            <select className="input-field" {...register('assignedTo')}>
              <option value="">Unassigned</option>
              {staff?.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea rows={3} className="input-field" {...register('notes')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Asset Image</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Asset' : 'Create Asset'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetForm;
