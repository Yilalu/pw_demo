// Standard heading block used at the top of content pages.
export default function PageIntro({ eyebrow, title, children, className = '' }) {
  return <div className={`page-intro ${className}`}>
    <span className="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    {children && <p>{children}</p>}
  </div>;
}
