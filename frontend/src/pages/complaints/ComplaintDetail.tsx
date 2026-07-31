import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, RefreshCw, Wrench } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner } from '../../components/common/Common';
import type { Complaint, User, Asset } from '../../types';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaints', id],
    queryFn: async () => (await api.get<{ data: Complaint }>(`/complaints/${id}`)).data.data,
  });

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setResolutionNotes(complaint.resolutionNotes || '');
    }
  }, [complaint]);

  const { data: staff } = useQuery({
    queryKey: ['users', 'staff-for-assign'],
    queryFn: async () => (await api.get<{ data: User[] }>('/users?limit=100')).data.data,
    enabled: user?.role === 'admin' || user?.role === 'supervisor',
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      (await api.put(`/complaints/${id}`, { status, resolutionNotes, assignedTo: assignedTo || null })).data,
    onSuccess: () => {
      toast.success('Complaint updated');
      queryClient.invalidateQueries({ queryKey: ['complaints', id] });
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async () => (await api.post(`/complaints/${id}/reanalyze`)).data,
    onSuccess: () => {
      toast.success('AI re-analysis complete');
      queryClient.invalidateQueries({ queryKey: ['complaints', id] });
    },
  });

  if (isLoading || !complaint) return <Spinner />;

  const canManage = user?.role === 'admin' || user?.role === 'supervisor';
  const asset = complaint.asset as Asset;
  const raisedBy = complaint.raisedBy as User;

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{complaint.title}</h1>
            <p className="text-sm text-gray-500">{complaint.complaintId} • Raised by {raisedBy?.name || 'N/A'}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed">{complaint.description}</p>

        {asset && <p className="mt-2 text-xs text-gray-500">Related asset: {asset.name} ({asset.assetId})</p>}
        {complaint.location && <p className="text-xs text-gray-500">Location: {complaint.location}</p>}

        {canManage && asset && !complaint.linkedMaintenance && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
          <button
            onClick={() =>
              navigate(
                `/maintenance/new?complaintId=${complaint._id}&assetId=${typeof asset === 'object' ? asset._id : asset}`
              )
            }
            className="btn-secondary mt-4 flex items-center gap-2 text-sm"
          >
            <Wrench size={14} /> Schedule Maintenance for This Complaint
          </button>
        )}
        {complaint.linkedMaintenance && (
          <button
            onClick={() => navigate(`/maintenance/${complaint.linkedMaintenance}`)}
            className="btn-secondary mt-4 flex items-center gap-2 text-sm"
          >
            <Wrench size={14} /> View Linked Maintenance Task
          </button>
        )}

        {complaint.attachments?.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {complaint.attachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} className="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <Sparkles size={16} className="text-primary-500" /> AI Complaint Analysis
          </h3>
          {canManage && (
            <button
              onClick={() => reanalyzeMutation.mutate()}
              disabled={reanalyzeMutation.isPending}
              className="flex items-center gap-1 text-xs text-primary-500"
            >
              <RefreshCw size={12} className={reanalyzeMutation.isPending ? 'animate-spin' : ''} /> Re-run
            </button>
          )}
        </div>
        {complaint.aiCategory ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
            <div><p className="text-xs text-gray-500">Category</p><p className="font-medium">{complaint.aiCategory}</p></div>
            <div><p className="text-xs text-gray-500">Severity</p><StatusBadge status={complaint.aiSeverity || ''} /></div>
            <div><p className="text-xs text-gray-500">Sentiment</p><p className="font-medium capitalize">{complaint.aiSentiment}</p></div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">AI analysis not yet available for this complaint.</p>
        )}
        {complaint.aiSummary && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Summary</p>
            <p className="text-sm">{complaint.aiSummary}</p>
          </div>
        )}
        {complaint.aiSuggestedAction && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Suggested Action</p>
            <p className="text-sm">{complaint.aiSuggestedAction}</p>
          </div>
        )}
      </div>

      {canManage && (
        <div className="mt-4 card p-6">
          <h3 className="mb-3 font-semibold text-sm">Manage Complaint</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {['open', 'in_review', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Assign To</label>
              <select className="input-field" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">Unassigned</option>
                {staff?.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Resolution Notes</label>
            <textarea
              rows={3}
              className="input-field"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="btn-primary mt-4"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;
