import { Bookmark, Cloud, Leaf, Sparkles, Sprout, Sun, Wind } from 'lucide-react';

const iconFor = { Energy: Sun, Food: Sprout, Transport: Wind, Waste: Cloud, Nature: Leaf, Fashion: Sparkles };

// Display one tip; the optional callback adds a save/unsave control on the tips page.
export default function TipCard({ tip, index = 0, onToggle, compact = false }) {
  // Fall back to the general leaf icon if a tip uses a category without a dedicated icon.
  const CategoryIcon = iconFor[tip.category] || Leaf;
  return <article className={`tip-card ${compact ? 'compact' : ''}`}>
    <div className={`tip-art art-${index % 4}`}>
      <span className="tip-number">0{index + 1}</span>
      <span className="tip-illustration"><CategoryIcon size={35} strokeWidth={1.45} /></span>
      <span className="impact-pill"><Sparkles size={12} /> {tip.impact}</span>
    </div>
    <div className="tip-body">
      <div className="card-meta"><span>{tip.category}</span><span>{tip.read_time} min read</span></div>
      <h3>{tip.title}</h3>
      <p>{tip.description}</p>
      {onToggle && <button className={`save-button ${tip.bookmarked ? 'saved' : ''}`} onClick={() => onToggle(tip)}>
        <Bookmark size={15} fill={tip.bookmarked ? 'currentColor' : 'none'} />
        {tip.bookmarked ? 'Saved to my tips' : 'Save this tip'}
      </button>}
    </div>
  </article>;
}
