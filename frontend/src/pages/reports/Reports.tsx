import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { API_BASE_URL } from '../../api/axios';
import { PageHeader } from '../../components/common/Common';

const ReportCard = ({
  title,
  description,
  endpoint,
  filename,
}: {
  title: string;
  description: string;
  endpoint: string;
  filename: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const download = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const res = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText size={18} className="text-primary-500" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <div className="flex gap-2 mb-3">
        <input type="date" className="input-field text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input-field text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <button onClick={download} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
        <Download size={14} /> {loading ? 'Generating...' : 'Download PDF'}
      </button>
    </div>
  );
};

const Reports = () => (
  <div>
    <PageHeader title="Reports" subtitle="Export AI-generated PDF reports for leadership review" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ReportCard
        title="Maintenance Summary Report"
        description="AI-written narrative + task breakdown for a date range"
        endpoint="/reports/maintenance-pdf"
        filename="maintenance-report.pdf"
      />
      <ReportCard
        title="Complaint Summary Report"
        description="Overview of complaints filed, resolved, and outstanding"
        endpoint="/reports/complaints-pdf"
        filename="complaint-report.pdf"
      />
    </div>
    <p className="mt-4 text-xs text-gray-500">
      Tip: for a single asset's full history report, open that asset's detail page and click "PDF".
    </p>
  </div>
);

export default Reports;
