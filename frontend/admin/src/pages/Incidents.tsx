import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getIncidents,
  createIncident,
  updateIncident,
  addIncidentUpdate,
  deleteIncident,
} from '../api/client';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = ['investigating', 'identified', 'monitoring', 'resolved'];
const SEVERITY_OPTIONS = ['minor', 'major', 'critical'];

export default function Incidents() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updateForms, setUpdateForms] = useState<Record<string, { status: string; message: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident created');
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateIncident(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const addUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      addIncidentUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Update posted');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident deleted');
    },
  });

  const incidents = data?.incidents ?? [];

  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    status: 'investigating',
    severity: 'minor',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Incident
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Create Incident</h2>
          <input
            placeholder="Title *"
            value={newIncident.title}
            onChange={(e) => setNewIncident((p) => ({ ...p, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={newIncident.description}
            onChange={(e) => setNewIncident((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newIncident.status}
              onChange={(e) => setNewIncident((p) => ({ ...p, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={newIncident.severity}
              onChange={(e) => setNewIncident((p) => ({ ...p, severity: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(newIncident)}
              disabled={!newIncident.title || createMutation.isPending}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Incident list */}
      {isLoading && <p className="text-gray-400 text-center py-10">Loading...</p>}
      {!isLoading && incidents.length === 0 && (
        <p className="text-gray-400 text-center py-16">No incidents. All systems go!</p>
      )}

      <div className="space-y-3">
        {incidents.map((inc: {
          id: string;
          title: string;
          status: string;
          severity: string;
          monitor_name: string | null;
          started_at: string;
          resolved_at: string | null;
          duration_minutes: number | null;
          description: string | null;
          updates?: Array<{ id: string; status: string; message: string; created_at: string }>;
        }) => (
          <div key={inc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <StatusBadge status={inc.status} />
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                    ${inc.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      inc.severity === 'major' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'}`}
                >
                  {inc.severity}
                </span>
                <h3 className="font-medium text-gray-900 truncate">{inc.title}</h3>
                {inc.monitor_name && (
                  <span className="text-xs text-gray-400">— {inc.monitor_name}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-gray-400">
                  {format(parseISO(inc.started_at), 'MMM d, HH:mm')}
                </span>
                {inc.status !== 'resolved' && (
                  <button
                    onClick={() => updateMutation.mutate({ id: inc.id, data: { status: 'resolved' } })}
                    className="text-xs text-green-600 hover:underline"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
                  className="text-gray-400"
                >
                  {expanded === inc.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this incident?')) deleteMutation.mutate(inc.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {expanded === inc.id && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
                {inc.description && <p className="text-sm text-gray-600">{inc.description}</p>}

                {/* Status update form */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Post Update</h4>
                  <div className="flex gap-2">
                    <select
                      value={updateForms[inc.id]?.status ?? ''}
                      onChange={(e) =>
                        setUpdateForms((p) => ({ ...p, [inc.id]: { ...p[inc.id], status: e.target.value } }))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="">— Status —</option>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      placeholder="Update message..."
                      value={updateForms[inc.id]?.message ?? ''}
                      onChange={(e) =>
                        setUpdateForms((p) => ({ ...p, [inc.id]: { ...p[inc.id], message: e.target.value } }))
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const f = updateForms[inc.id];
                        if (!f?.message) return;
                        addUpdateMutation.mutate({
                          id: inc.id,
                          data: { status: f.status || undefined, message: f.message },
                        });
                        setUpdateForms((p) => ({ ...p, [inc.id]: { status: '', message: '' } }));
                      }}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
