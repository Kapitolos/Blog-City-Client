import React, { useState } from 'react';
import './ReportModal.css';
import { API_BASE_URL } from '../config.js';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' }
];

const ReportModal = ({ blogId, commentId, reporterId, onClose, onSubmitted }) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reporterId) {
      setError('You must be signed in to report.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    fetch(`${API_BASE_URL}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blog_id: blogId || null,
        comment_id: commentId || null,
        reporter_id: reporterId,
        reason,
        details: details.trim() || undefined
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        if (onSubmitted) onSubmitted();
        onClose();
      })
      .catch(err => {
        setError(err.message || 'Failed to submit report');
        setIsSubmitting(false);
      });
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>Report content</h3>
          <button type="button" className="report-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="report-modal-body">
            <label htmlFor="report-reason">Reason</label>
            <select
              id="report-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            >
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <label htmlFor="report-details">Additional details (optional)</label>
            <textarea
              id="report-details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Optional context for moderators"
              rows={3}
              maxLength={500}
            />
            {error && <p className="report-modal-error">{error}</p>}
          </div>
          <div className="report-modal-footer">
            <button type="button" className="report-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="report-modal-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
