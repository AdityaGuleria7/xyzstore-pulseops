import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, LoaderCircle, Sparkles } from 'lucide-react';
import * as api from '../lib/api';

export default function OverdueOrderAdvice({ count, percentage, team, minutesPerOrder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setSuggestions([]);
    setExpanded(false);
    setError('');
  }, [count, team, minutesPerOrder]);

  const requestSuggestions = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.getOverdueSuggestions({ team, minutesPerOrder });
      setSuggestions(result.suggestions);
      setExpanded(true);
    } catch (requestError) {
      setError(api.errorMessage(requestError, 'Could not generate suggestions. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="command-overdue-card" aria-label="Today's operational suggestions">
      <div className="command-overdue-heading">
        <div className="command-overdue-title">
          <span className="command-overdue-icon"><AlertTriangle aria-hidden="true" /></span>
          <div><h2>Today’s recommendations</h2><span className="command-overdue-status">{count ? 'Overdue recovery' : 'Queue is on track'}</span></div>
        </div>
        <button type="button" className="command-overdue-action" onClick={requestSuggestions} disabled={loading} aria-expanded={expanded}>
          {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
          {loading ? 'Preparing…' : expanded ? 'Hide suggestions' : suggestions.length ? 'Refresh today’s 4 suggestions' : 'Get today’s 4 suggestions'}
          {!loading && (expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />)}
        </button>
      </div>
      <div className="command-overdue-summary">
        <strong className="command-overdue-count">{count}</strong>
        <div><span>open orders past deadline</span><strong>{percentage}%</strong><span>of open queue</span></div>
      </div>
      {error && <p className="command-overdue-error" role="alert">{error}</p>}
      {expanded && suggestions.length > 0 && <ul className="command-overdue-suggestions" aria-live="polite">{suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}><span>{index + 1}</span><p>{suggestion}</p></li>)}</ul>}
      <p className="command-overdue-footnote">Four actions based on today’s live orders, courier cutoffs and stock.</p>
    </section>
  );
}
