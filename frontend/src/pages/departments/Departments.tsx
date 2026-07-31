import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Building2, X, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import type { Department, User } from '../../types';

interface DeptForm {
  name: string;
  code: string;
  description: string;
  location: string;
  head: string;
}

const Departments = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<DeptForm>();

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get<{ data: Department[] }>('/departments')).data.data,
  });

  // Needed to populate the "Department Head" dropdown - previously this field
  // existed in the data model but had no UI to actually set it.
  const { data: staff } = useQuery({
    queryKey: ['users', 'staff-for-assign'],
    queryFn: async () => (await api.get<{ data: User[] }>('/users?limit=100')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: async (values: DeptForm) =>
      (await api.post('/departments', { ...values, head: values.head || undefined })).data,
    onSuccess: () => {
      toast.success('Department created');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      reset();
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create department'),
  });

  const updateHeadMutation = useMutation({
    mutationFn: async ({ id, head }: { id: string; head: string }) =>
      (await api.put(`/departments/${id}`, { head: head || null })).data,
    onSuccess: () => {
      toast.success('Department head updated');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update department head'),
  });

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage airport departments and divisions"
        action={
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Department'}
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input className="input-field" placeholder="Department name *" {...register('name', { required: true })} />
          <input className="input-field" placeholder="Code (e.g. TERM) *" {...register('code', { required: true })} />
          <input className="input-field" placeholder="Location" {...register('location')} />
          <input className="input-field" placeholder="Description" {...register('description')} />
          <select className="input-field sm:col-span-2" {...register('head')}>
            <option value="">Department Head (optional)</option>
            {staff?.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
            ))}
          </select>
          <button type="submit" className="btn-primary sm:col-span-2">Save Department</button>
        </form>
      )}

      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState message="No departments yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((d) => {
            const currentHeadId = typeof d.head === 'object' ? (d.head as User)?._id : (d.head as string) || '';
            return (
              <div key={d._id} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className="text-primary-500" />
                  <p className="font-semibold text-sm">{d.name}</p>
                </div>
                <p className="text-xs text-gray-500">Code: {d.code}</p>
                {d.location && <p className="text-xs text-gray-500">📍 {d.location}</p>}
                {d.description && <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{d.description}</p>}

                <div className="mt-3 flex items-center gap-2">
                  <UserIcon size={14} className="text-gray-400 shrink-0" />
                  <select
                    className="input-field !py-1 text-xs"
                    value={currentHeadId}
                    onChange={(e) => updateHeadMutation.mutate({ id: d._id, head: e.target.value })}
                  >
                    <option value="">No head assigned</option>
                    {staff?.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Departments;
