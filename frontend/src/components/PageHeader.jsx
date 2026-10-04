import React from 'react';

export default function PageHeader({ title, right, description }) {
  return (
    <div className="ops-page-header flex justify-between items-start gap-5">
      <div className="min-w-0">
        <div className="page-header-title-row flex items-center gap-2.5">
          <h1 className="ops-page-title">{title}</h1>
        </div>
        {description && <p className="ops-page-subtitle">{description}</p>}
      </div>
      <div className="page-header-actions shrink-0">{right}</div>
    </div>
  );
}
