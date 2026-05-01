import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Mail, Slack, Webhook } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAlertChannels, createAlertChannel, deleteAlertChannel } from '../api/client';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail size={16} />,
  slack: <Slack size={16} />,
  discord: <Webhook size={16} />,
  webhook: <Webhook size={16} />,
};

const CHANNEL_FIELDS: Record<string, Array<{ key: string; label: string; placeholder: string; type?: string }>> = {
  email: [
    { key: 'to', label: 'To Email', placeholder: 'team@example.com', type: 'email' },
  ],
  slack: [
    { key: 'webhook_url', label: 'Slack Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
  ],
  discord: [
    { key: 'webhook_url', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' },
  ],
  webhook: [
    { key: 'url', label: 'Webhook URL', placeholder: 'https://example.com/alert' },
  ],
};

export default function AlertChannels() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'slack', config: {} as Record<string, string> });

  const { data, isLoading } = useQuery({
    queryKey: ['alert-channels'],
    queryFn: () => getAlertChannels().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createAlertChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
      toast.success('Alert channel created');
      setShowForm(false);
      setForm({ name: '', type: 'slack', config: {} });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to create channel');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlertChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-channels'] });
      toast.success('Channel deleted');
    },
  });

  const channels = data?.channels ?? [];
  const fields = CHANNEL_FIELDS[form.type] ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name: form.name, type: form.type, config: form.config });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Channels</h1>
          <p className="text-gray-500 text-sm mt-1">Configure where to send alerts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Channel
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Alert Channel</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="DevTeam Slack"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, config: {} }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.keys(CHANNEL_FIELDS).map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type ?? 'text'}
                  value={form.config[field.key] ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, config: { ...p.config, [field.key]: e.target.value } }))
                  }
                  placeholder={field.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Create Channel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel list */}
      {isLoading && <p className="text-gray-400 text-center py-10">Loading...</p>}
      {!isLoading && channels.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400">No alert channels configured.</p>
          <p className="text-sm text-gray-400 mt-1">Add email, Slack, Discord, or webhook channels.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch: { id: string; name: string; type: string; is_active: boolean }) => (
          <div key={ch.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                {CHANNEL_ICONS[ch.type] ?? <Webhook size={16} />}
              </div>
              <div>
                <p className="font-medium text-gray-900">{ch.name}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{ch.type}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete "${ch.name}"?`)) deleteMutation.mutate(ch.id);
              }}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
