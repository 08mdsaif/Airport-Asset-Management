import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { PageHeader } from '../../components/common/Common';
import type { Asset } from '../../types';

interface ComplaintFormValues {
  title: string;
  description: string;
  asset: string;
  location: string;
}

const ComplaintForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ComplaintFormValues>();

  const { data: assets } = useQuery({
    queryKey: ['assets', 'all-for-select'],
    queryFn: async () => (await api.get<{ data: Asset[] }>('/assets?limit=200')).data.data,
  });

  const onSubmit = async (values: ComplaintFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => v && formData.append(k, v));
      if (files) Array.from(files).forEach((f) => formData.append('attachments', f));

      const { data } = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Complaint filed! AI analysis has been applied.');
      navigate(`/complaints/${data.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="File a Complaint" subtitle="Our AI will automatically classify severity and category" />

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input className="input-field" placeholder="e.g. Escalator making grinding noise" {...register('title', { required: true })} />
          {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description *</label>
          <textarea
            rows={5}
            className="input-field"
            placeholder="Describe the issue in detail..."
            {...register('description', { required: true })}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">Description is required</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Related Asset (optional)</label>
          <select className="input-field" {...register('asset')}>
            <option value="">Not asset-specific</option>
            {assets?.map((a) => (
              <option key={a._id} value={a._id}>{a.name} ({a.assetId})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input className="input-field" placeholder="e.g. Terminal 2, Gate 14" {...register('location')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Attach Photos (optional)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;
