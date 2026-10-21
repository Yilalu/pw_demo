import { CheckCircle2, CircleHelp, X } from 'lucide-react';

// A dismissible, accessible status message; pass null when there is nothing to show.
export default function Toast({ toast, clear }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type}`} role="status">
    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <CircleHelp size={18} />}
    <span>{toast.message}</span>
    <button className="icon-button toast-close" onClick={clear} aria-label="Dismiss message"><X size={16} /></button>
  </div>;
}
