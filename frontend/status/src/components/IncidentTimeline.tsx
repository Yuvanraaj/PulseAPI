import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface Update {
  id: string;
  status: string;
  message: string;
  created_at: string;
}

interface Incident {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  monitor_name: string | null;
  updates: Update[];
}

const STATUS_COLORS: Record<string, string> = {
  investigating: 'text-red-600 bg-red-50',
  identified: 'text-orange-600 bg-orange-50',
  monitoring: 'text-blue-600 bg-blue-50',
  resolved: 'text-green-700 bg-green-50',
};

export default function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">
        No incidents in the past 30 days.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {incidents.map((inc) => (
        <div key={inc.id} className="border-l-4 border-gray-200 pl-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900">{inc.title}</h3>
              {inc.monitor_name && (
                <p className="text-xs text-gray-400 mt-0.5">{inc.monitor_name}</p>
              )}
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${STATUS_COLORS[inc.status] ?? 'text-gray-600 bg-gray-100'}`}
            >
              {inc.status}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1">
            {format(parseISO(inc.started_at), 'MMM d, yyyy HH:mm')}
            {inc.resolved_at && (
              <> — resolved {formatDistanceToNow(parseISO(inc.resolved_at), { addSuffix: true })}</>
            )}
          </p>

          {inc.description && (
            <p className="text-sm text-gray-600 mt-2">{inc.description}</p>
          )}

          {inc.updates.length > 0 && (
            <ul className="mt-3 space-y-2">
              {inc.updates.map((u) => (
                <li key={u.id} className="text-sm">
                  <span className="text-gray-400 text-xs mr-2">
                    {format(parseISO(u.created_at), 'HH:mm')}
                  </span>
                  {u.status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium mr-2 capitalize ${STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  )}
                  {u.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
