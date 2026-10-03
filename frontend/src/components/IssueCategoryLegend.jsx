import React from 'react';
import { ISSUE_CATEGORY_META } from '../utils/ops';

export default function IssueCategoryLegend({ counts = {}, active = 'all', onChange }) {
  return <div className="flex flex-wrap gap-2" role="tablist" aria-label="Issue categories">
    <button type="button" onClick={() => onChange?.('all')} className={`issue-filter ${active === 'all' ? 'is-active' : ''}`}><span>All</span><b>{Object.values(counts).reduce((a,b) => a + b, 0)}</b></button>
    {Object.entries(ISSUE_CATEGORY_META).map(([key, meta]) => <button key={key} type="button" onClick={() => onChange?.(key)} className={`issue-filter ${active === key ? 'is-active' : ''}`}><span className={`issue-filter-dot`} style={{ background: meta.stripe }} />{meta.label}<b>{counts[key] || 0}</b></button>)}
  </div>;
}
