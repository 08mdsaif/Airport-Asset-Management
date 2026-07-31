import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell } from 'lucide-react';
import api from '../../api/axios';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import type { Notification } from '../../types';

const iconColor: Record<string, string> = {
  complaint: 'text-blue-500',
  maintenance: 'text-yellow-500',
  asset: 'text-red-500',
  transfer: 'text-purple-500',
  system: 'text-gray-500',
  ai_alert: 'text-primary-500',
};

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: async () => (await api.get<{ data: Notification[] }>('/notifications?limit=50')).data.data,
  });

  const markAllRead = useMutation({
    mutationFn: async () => (await api.put('/notifications/read-all')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => (await api.put(`/notifications/${id}/read`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Notifications"
        action={
          <button onClick={() => markAllRead.mutate()} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={16} /> Mark all as read
          </button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState message="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.isRead) markOneRead.mutate(n._id);
                if (n.link) navigate(n.link);
              }}
              className={`card flex cursor-pointer items-start gap-3 p-4 ${!n.isRead ? 'border-l-4 border-l-primary-500' : ''}`}
            >
              <Bell size={18} className={iconColor[n.type] || 'text-gray-400'} />
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="mt-1 text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
              </div>
              {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
