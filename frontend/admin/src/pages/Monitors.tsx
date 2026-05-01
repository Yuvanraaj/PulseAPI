import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Pause, Play, ExternalLink, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMonitors, createMonitor, deleteMonitor, updateMonitor } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import MonitorForm from '../components/MonitorForm';

interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status_code: number;
  headers: Record<string, string> | null;
  body: string | null;
  validate_ssl: boolean;
  response_body_match: string | null;
  description: string | null;
  tags: string[];
  current_status: string;
  uptime_percentage: number;
  avg_response_time: number;
  is_active: boolean;
}

export default function Monitors() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editMonitor, setEditMonitor] = useState<Monitor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => getMonitors().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      toast.success('Monitor created');
      setShowForm(false);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to create monitor');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateMonitor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      toast.success('Monitor updated');
      setEditMonitor(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to update monitor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      toast.success('Monitor deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateMonitor(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });

  const monitors = data?.monitors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitors</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Monitor
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">New Monitor</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <MonitorForm
              onSubmit={(data) => createMutation.mutate(data)}
              loading={createMutation.isPending}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editMonitor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Edit Monitor</h2>
              <button onClick={() => setEditMonitor(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <MonitorForm
              initial={{
                name: editMonitor.name,
                url: editMonitor.url,
                method: editMonitor.method,
                interval_seconds: editMonitor.interval_seconds,
                timeout_seconds: editMonitor.timeout_seconds,
                expected_status_code: editMonitor.expected_status_code,
                headers: editMonitor.headers ?? {},
                body: editMonitor.body ?? '',
                validate_ssl: editMonitor.validate_ssl,
                response_body_match: editMonitor.response_body_match ?? '',
                description: editMonitor.description ?? '',
                tags: editMonitor.tags ?? [],
              }}
              onSubmit={(data) => editMutation.mutate({ id: editMonitor.id, data })}
              loading={editMutation.isPending}
              onCancel={() => setEditMonitor(null)}
            />
          </div>
        </div>
      )}

      {/* Monitor table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading && (
          <p className="text-center text-gray-400 py-16">Loading...</p>
        )}
        {!isLoading && monitors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">No monitors yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >
              Create your first monitor
            </button>
          </div>
        )}
        {monitors.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Uptime</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Avg Response</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Interval</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monitors.map((m: {
                id: string;
                name: string;
                url: string;
                current_status: string;
                uptime_percentage: number;
                avg_response_time: number;
                interval_seconds: number;
                is_active: boolean;
              }) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/app/monitors/${m.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {m.name}
                    </Link>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{m.url}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={m.is_active ? m.current_status : 'unknown'} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">{m.uptime_percentage ?? 0}%</td>
                  <td className="px-4 py-3.5 text-gray-700">{m.avg_response_time ?? 0} ms</td>
                  <td className="px-4 py-3.5 text-gray-500">{m.interval_seconds}s</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                        title="Open URL"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={() => setEditMonitor(m as Monitor)}
                        className="text-gray-400 hover:text-blue-500"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: m.id, is_active: !m.is_active })}
                        className="text-gray-400 hover:text-gray-600"
                        title={m.is_active ? 'Pause' : 'Resume'}
                      >
                        {m.is_active ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete monitor "${m.name}"?`)) {
                            deleteMutation.mutate(m.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
