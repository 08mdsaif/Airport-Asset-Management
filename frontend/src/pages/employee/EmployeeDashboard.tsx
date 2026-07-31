import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, MessageSquareWarning, Wrench } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import ChatAssistant from '../../components/common/ChatAssistant';
import type { Complaint, Maintenance } from '../../types';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const { data: myComplaints, isLoading: loadingComplaints } = useQuery({
    queryKey: ['complaints', 'mine'],
    queryFn: async () => (await api.get<{ data: Complaint[] }>('/complaints?limit=5')).data.data,
  });

  const { data: myTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['maintenance', 'mine'],
    queryFn: async () => (await api.get<{ data: Maintenance[] }>('/maintenance?limit=5')).data.data,
  });

  return (
    <div>
      <PageHeader title={`Hi, ${user?.name?.split(' ')[0]} 👋`} subtitle="Here's what's on your plate today" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-sm">
                <MessageSquareWarning size={16} /> My Recent Complaints
              </h3>
              <Link to="/complaints" className="text-xs text-primary-500 font-medium">
                View all
              </Link>
            </div>
            {loadingComplaints ? (
              <Spinner />
            ) : !myComplaints?.length ? (
              <EmptyState message="You haven't filed any complaints yet" />
            ) : (
              <div className="space-y-2">
                {myComplaints.map((c) => (
                  <Link
                    to={`/complaints/${c._id}`}
                    key={c._id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.complaintId}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-sm">
                <Wrench size={16} /> My Maintenance Tasks
              </h3>
              <Link to="/maintenance" className="text-xs text-primary-500 font-medium">
                View all
              </Link>
            </div>
            {loadingTasks ? (
              <Spinner />
            ) : !myTasks?.length ? (
              <EmptyState message="No maintenance tasks assigned to you" />
            ) : (
              <div className="space-y-2">
                {myTasks.map((t) => (
                  <Link
                    to={`/maintenance/${t._id}`}
                    key={t._id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-gray-500">
                        Scheduled: {new Date(t.scheduledDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/complaints/new"
            className="card flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <ClipboardList className="text-primary-500" />
            <div>
              <p className="font-medium text-sm">File a new complaint</p>
              <p className="text-xs text-gray-500">Report a broken or malfunctioning asset</p>
            </div>
          </Link>
        </div>

        <div className="lg:col-span-1">
          <ChatAssistant />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
