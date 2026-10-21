import { ArrowRight } from 'lucide-react';

// Explain why a list is empty and optionally offer a direct way to recover.
export default function EmptyState({ icon, title, text, action, actionLabel }) {
  return <div className="empty-state">
    <span className="empty-icon">{icon}</span>
    <h3>{title}</h3>
    <p>{text}</p>
    {action && <button className="button button-outline button-small" onClick={action}>{actionLabel} <ArrowRight size={15} /></button>}
  </div>;
}
