import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Spinner, EmptyState, PageHeader } from '../../components/common/Common';
import StatusBadge from '../../components/common/StatusBadge';
import type { User, Department } from '../../types';

const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search }],
    queryFn: async () => (await api.get<{ data: User[] }>('/users', { params: { search, limit: 100 } })).data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get<{ data: Department[] }>('/departments')).data.data,
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      (await api.put(`/users/${id}`, { role })).data,
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update role'),
  });

  const updateDepartment = useMutation({
    mutationFn: async ({ id, department }: { id: string; department: string }) =>
      (await api.put(`/users/${id}`, { department: department || null })).data,
    onSuccess: () => {
      toast.success('Department updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update department'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.put(`/users/${id}`, { isActive })).data,
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage staff accounts, roles, and access" />

      <input
        className="input-field mb-4 max-w-sm"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState message="No users found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Department</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => {
                const currentDeptId = typeof u.department === 'object' ? (u.department as Department)?._id : (u.department as string) || '';
                return (
                  <tr key={u._id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="p-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3">
                      <select
                        className="input-field !py-1 !px-2 text-xs w-auto"
                        value={currentDeptId}
                        onChange={(e) => updateDepartment.mutate({ id: u._id, department: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {departments?.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        className="input-field !py-1 !px-2 text-xs w-auto"
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ id: u._id, role: e.target.value })}
                      >
                        <option value="admin">Admin</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="employee">Employee</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={u.isActive ? 'active' : 'decommissioned'} />
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActive.mutate({ id: u._id, isActive: !u.isActive })}
                        className="text-xs text-primary-500 font-medium"
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Users;

