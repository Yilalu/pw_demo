import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Reusable section heading with an optional link to a related page.
export default function SectionTitle({ eyebrow, title, link, to }) {
  return <div className="section-title">
    <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
    {link && <Link className="text-link" to={to}>{link}<ArrowRight size={16} /></Link>}
  </div>;
}
