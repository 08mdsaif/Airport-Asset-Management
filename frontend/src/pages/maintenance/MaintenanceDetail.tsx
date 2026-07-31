import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner } from '../../components/common/Common';
import type { Maintenance, Asset, User } from '../../types';

const MaintenanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data: record, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => (await api.get<{ data: Maintenance }>(`/maintenance/${id}`)).data.data,
  });

  const isManager = user?.role === 'admin' || user?.role === 'supervisor';

  const { data: staff } = useQuery({
    queryKey: ['users', 'staff-for-assign'],
    queryFn: async () => (await api.get<{ data: User[] }>('/users?limit=100')).data.data,
    enabled: isManager,
  });

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setCost(record.cost || 0);
      setPriority(record.priority);
      setAssignedTo(typeof record.assignedTo === 'object' ? (record.assignedTo as User)?._id || '' : (record.assignedTo as string) || '');
      setRemarks(record.remarks || '');
    }
  }, [record]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Managers can update everything; employees are only permitted to change
      // status/remarks anyway (enforced server-side too), so only send those.
      const payload: Record<string, unknown> = { status, remarks };
      if (isManager) {
        payload.cost = cost;
        payload.priority = priority;
        payload.assignedTo = assignedTo || null;
      }
      return (await api.put(`/maintenance/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success('Maintenance task updated');
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update task'),
  });

  if (isLoading || !record) return <Spinner />;

  const asset = record.asset as Asset;
  const assignedUser = record.assignedTo as User;

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{record.title}</h1>
            <p className="text-sm text-gray-500">
              {typeof asset === 'object' ? `${asset.name} (${asset.assetId})` : ''} • {record.type}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={record.priority} />
            <StatusBadge status={record.status} />
          </div>
        </div>

        {record.description && <p className="mt-4 text-sm leading-relaxed">{record.description}</p>}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-gray-500">Scheduled</p><p className="font-medium">{new Date(record.scheduledDate).toLocaleDateString('en-IN')}</p></div>
          {record.completedDate && (
            <div><p className="text-xs text-gray-500">Completed</p><p className="font-medium">{new Date(record.completedDate).toLocaleDateString('en-IN')}</p></div>
          )}
          <div><p className="text-xs text-gray-500">Cost</p><p className="font-medium">Rs. {record.cost || 0}</p></div>
          <div>
            <p className="text-xs text-gray-500">Assigned To</p>
            <p className="font-medium">{typeof assignedUser === 'object' && assignedUser ? assignedUser.name : 'Unassigned'}</p>
          </div>
        </div>
      </div>

      {record.aiPriorityReasoning && (
        <div className="mt-4 card p-6">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-sm">
            <Sparkles size={16} className="text-primary-500" /> AI Priority Prediction
          </h3>
          <p className="text-sm mb-1">Priority score: <span className="font-semibold">{record.aiPriorityScore}/100</span></p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{record.aiPriorityReasoning}</p>
        </div>
      )}

      <div className="mt-4 card p-6">
        <h3 className="mb-3 font-semibold text-sm">Update Task</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              {['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Cost, priority, and reassignment are manager-only actions - both in this UI
              and enforced server-side, so employees never see controls they can't use. */}
          {isManager && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Cost (Rs.)</label>
                <input type="number" className="input-field" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Priority</label>
                <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Assigned To</label>
                <select className="input-field" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">Unassigned</option>
                  {staff?.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Remarks</label>
          <textarea rows={3} className="input-field" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary mt-4">
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default MaintenanceDetail;
