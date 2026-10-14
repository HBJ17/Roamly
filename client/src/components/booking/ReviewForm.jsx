import React, { useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { Field, StarInput } from '../ui';

const CRITERIA = ['cleanliness', 'service', 'location', 'value'];

export default function ReviewForm({ bookingId, itemId, onDone }) {
  const [form, setForm] = useState({ rating: 5, ratings: { cleanliness: 5, service: 5, location: 5, value: 5 }, title: '', comment: '', travelType: 'Couple' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/reviews', { ...form, bookingId, itemId });
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <Field label="Overall"><StarInput label="Overall rating" value={form.rating} onChange={(rating) => setForm({ ...form, rating })} /></Field>
      <div className="form-grid">
        {CRITERIA.map((c) => (
          <Field key={c} label={c}>
            <StarInput label={c} value={form.ratings[c]} onChange={(v) => setForm({ ...form, ratings: { ...form.ratings, [c]: v } })} />
          </Field>
        ))}
      </div>
      <Field label="Trip type">
        <select className="form-control" value={form.travelType} onChange={(e) => setForm({ ...form, travelType: e.target.value })}>
          {['Solo', 'Couple', 'Family', 'Friends', 'Business'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Headline"><input className="form-control" required minLength={3} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Your review"><textarea className="form-control" rows={4} required minLength={10} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></Field>
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Posting…' : 'Post review'}</button>
    </form>
  );
}
