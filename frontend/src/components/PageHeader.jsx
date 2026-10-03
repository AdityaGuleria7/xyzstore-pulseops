import React from 'react';
import { CircleHelp } from 'lucide-react';

/**
 * Shared operations page header. The supporting copy lives behind a small
 * question-mark affordance so tabs stay visually clean while remaining
 * discoverable and accessible on hover/focus.
 */
export default function PageHeader({ title, help, right }) {
  return (
    <div className="ops-page-header flex justify-between items-start gap-5">
      <div className="min-w-0">
        <div className="page-header-title-row flex items-center gap-2.5">
          <h1 className="ops-page-title">{title}</h1>
          {help && (
            <div className="relative group shrink-0">
              <button
                type="button"
                className="page-help"
                aria-label={`About ${title}`}
              >
                <CircleHelp className="w-4 h-4" />
              </button>
              <div className="page-help-tooltip" role="tooltip">
                {help}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="page-header-actions shrink-0">{right}</div>
    </div>
  );
}
