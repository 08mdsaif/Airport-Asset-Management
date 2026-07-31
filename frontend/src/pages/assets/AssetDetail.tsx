import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Edit, Download, Sparkles, QrCode, ArrowLeft } from 'lucide-react';
import api, { API_BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner } from '../../components/common/Common';
import type { Asset, Department, User } from '../../types';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['assets', id],
    queryFn: async () => (await api.get<{ data: Asset }>(`/assets/${id}`)).data.data,
  });

  const regenerateQR = useMutation({
    mutationFn: async () => (await api.post(`/assets/${id}/qrcode`)).data,
    onSuccess: () => {
      toast.success('QR code regenerated');
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
    },
  });

  const getAISummary = async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.get(`/assets/${id}/ai-summary`);
      setAiSummary(data.data.summary);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const downloadPDF = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/reports/asset-pdf/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-report-${asset?.assetId}.pdf`;
    a.click();
  };

  if (isLoading || !asset) return <Spinner />;

  const canManage = user?.role === 'admin' || user?.role === 'supervisor';
  const dept = asset.department as Department;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{asset.name}</h1>
            <p className="text-sm text-gray-500">{asset.assetId} • {asset.category}</p>
            <div className="mt-2 flex gap-2">
              <StatusBadge status={asset.status} />
              <StatusBadge status={asset.criticality} />
            </div>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <Link to={`/assets/${id}/edit`} className="btn-secondary flex items-center gap-1">
                <Edit size={14} /> Edit
              </Link>
            )}
            <button onClick={downloadPDF} className="btn-secondary flex items-center gap-1">
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        {asset.image && (
          <img src={asset.image} alt={asset.name} className="mt-4 h-48 w-full rounded-lg object-cover" />
        )}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Info label="Department" value={dept?.name || 'Unassigned'} />
          <Info label="Location" value={asset.location || 'N/A'} />
          <Info label="Manufacturer" value={asset.manufacturer || 'N/A'} />
          <Info label="Model" value={asset.model || 'N/A'} />
          <Info label="Serial Number" value={asset.serialNumber || 'N/A'} />
          <Info label="Utilization" value={`${asset.utilization}%`} />
          <Info label="Purchase Date" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('en-IN') : 'N/A'} />
          <Info label="Warranty Expiry" value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('en-IN') : 'N/A'} />
          <Info
            label="Assigned To"
            value={typeof asset.assignedTo === 'object' && asset.assignedTo ? (asset.assignedTo as User).name : 'Unassigned'}
          />
        </div>

        {asset.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm">{asset.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6 flex flex-col items-center">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm self-start">
            <QrCode size={16} /> Asset QR Code
          </h3>
          {asset.qrCodeUrl ? (
            <img src={asset.qrCodeUrl} alt="QR Code" className="h-40 w-40" />
          ) : (
            <p className="text-sm text-gray-400">No QR code generated yet</p>
          )}
          {canManage && (
            <button onClick={() => regenerateQR.mutate()} className="btn-secondary mt-3 text-xs">
              Regenerate QR Code
            </button>
          )}
        </div>

        <div className="card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
            <Sparkles size={16} className="text-primary-500" /> AI Summary of Asset History
          </h3>
          {aiSummary ? (
            <p className="text-sm leading-relaxed">{aiSummary}</p>
          ) : (
            <button onClick={getAISummary} disabled={loadingSummary} className="btn-primary text-xs">
              {loadingSummary ? 'Generating...' : 'Generate AI Summary'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default AssetDetail;
