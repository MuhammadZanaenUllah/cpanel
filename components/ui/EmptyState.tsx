import { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="empty-state">
      {icon && <div className="flex justify-center mb-3 text-slate-300">{icon}</div>}
      <p className="font-semibold text-slate-500 text-sm">{title}</p>
      {description && <p className="text-slate-400 text-xs mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
