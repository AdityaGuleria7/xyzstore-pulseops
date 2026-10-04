import React, { useEffect, useRef } from 'react';
import { CircleHelp } from 'lucide-react';

export default function PageHeader({ title, help, right, description }) {
  const helpRef = useRef(null);

  useEffect(() => {
    if (!help) return undefined;
    const closeOnOutsideClick = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        helpRef.current.open = false;
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && helpRef.current?.open) {
        helpRef.current.open = false;
        helpRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [help]);

  return (
    <div className="ops-page-header flex justify-between items-start gap-5">
      <div className="min-w-0">
        <div className="page-header-title-row flex items-center gap-2.5">
          <h1 className="ops-page-title">{title}</h1>
          {help && (
            <details className="page-help-wrap" ref={helpRef}>
              <summary className="page-help" aria-label={`About ${title}`} title={`About ${title}`}>
                <CircleHelp aria-hidden="true" className="page-help-icon" />
              </summary>
              <div className="page-help-tooltip" role="note">
                <span className="page-help-eyebrow">PAGE GUIDE</span>
                {help}
              </div>
            </details>
          )}
        </div>
        {description && <p className="ops-page-subtitle">{description}</p>}
      </div>
      <div className="page-header-actions shrink-0">{right}</div>
    </div>
  );
}
