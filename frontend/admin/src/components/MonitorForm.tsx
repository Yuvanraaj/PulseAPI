import { useState } from 'react';

interface MonitorFormData {
  name: string;
  url: string;
  method: string;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status_code: number;
  description: string;
  tags: string[];
  validate_ssl: boolean;
  response_body_match: string;
  headers: Record<string, string>;
  body: string;
}

interface Props {
  initial?: Partial<MonitorFormData>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function MonitorForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState<MonitorFormData>({
    name: initial?.name ?? '',
    url: initial?.url ?? '',
    method: initial?.method ?? 'GET',
    interval_seconds: initial?.interval_seconds ?? 60,
    timeout_seconds: initial?.timeout_seconds ?? 10,
    expected_status_code: initial?.expected_status_code ?? 200,
    description: initial?.description ?? '',
    tags: initial?.tags ?? [],
    validate_ssl: initial?.validate_ssl ?? true,
    response_body_match: initial?.response_body_match ?? '',
    headers: initial?.headers ?? {},
    body: initial?.body ?? '',
  });

  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      ...form,
      tags,
      response_body_match: form.response_body_match || null,
      description: form.description || null,
      body: form.body || null,
    });
  }

  function set<K extends keyof MonitorFormData>(key: K, value: MonitorFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Payment API"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>URL *</label>
          <input
            required
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://api.example.com/health"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Method</label>
          <select
            value={form.method}
            onChange={(e) => set('method', e.target.value)}
            className={inputClass}
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Expected Status Code</label>
          <input
            type="number"
            value={form.expected_status_code}
            onChange={(e) => set('expected_status_code', parseInt(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Check Interval (seconds)</label>
          <select
            value={form.interval_seconds}
            onChange={(e) => set('interval_seconds', parseInt(e.target.value))}
            className={inputClass}
          >
            {[60, 120, 300, 600, 900, 1800, 3600].map((s) => (
              <option key={s} value={s}>
                {s < 3600 ? `${s / 60} min` : '1 hour'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Timeout (seconds)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={form.timeout_seconds}
            onChange={(e) => set('timeout_seconds', parseInt(e.target.value))}
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Description</label>
          <input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional description"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="production, critical, payments"
            className={inputClass}
          />
        </div>

        {['POST', 'PUT', 'PATCH'].includes(form.method) && (
          <div className="col-span-2">
            <label className={labelClass}>Request Body (JSON)</label>
            <textarea
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder='{"key": "value"}'
              rows={4}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
        )}

        <div className="col-span-2">
          <label className={labelClass}>Custom Headers (one per line, key: value)</label>
          <textarea
            value={
              Object.entries(form.headers)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n')
            }
            onChange={(e) => {
              const headers: Record<string, string> = {};
              e.target.value.split('\n').forEach((line) => {
                const idx = line.indexOf(':');
                if (idx > 0) {
                  headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
                }
              });
              set('headers', headers);
            }}
            placeholder="Authorization: Bearer token123\nX-Api-Key: abc"
            rows={3}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Response Body Match (regex, optional)</label>
          <input
            value={form.response_body_match}
            onChange={(e) => set('response_body_match', e.target.value)}
            placeholder='"status":"ok"'
            className={inputClass}
          />
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="validate_ssl"
            checked={form.validate_ssl}
            onChange={(e) => set('validate_ssl', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="validate_ssl" className="text-sm text-gray-700">
            Validate SSL certificate
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Monitor'}
        </button>
      </div>
    </form>
  );
}
