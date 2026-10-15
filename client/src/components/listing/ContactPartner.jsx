import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal, Field } from '../ui';

// Opens (or continues) a conversation with the partner that owns this listing or booking.
export default function ContactPartner({ itemType, itemId, bookingId, partnerName, label = 'Ask the partner' }) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  if (user && role !== 'user') return null;

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/conversations', { itemType, itemId, bookingId, message });
      toast.success('Message sent');
      setOpen(false);
      navigate(`/account/messages/${res.data.data._id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="btn btn-sm btn-blue" onClick={() => (user ? setOpen(true) : navigate('/login'))}>
        <MessageCircle size={13} /> {label}
      </button>
      <Modal open={open} title={`Message ${partnerName || 'the partner'}`} onClose={() => setOpen(false)}>
        <form onSubmit={send}>
          <Field label="Your question" hint="Partners usually reply within a few hours.">
            <textarea className="form-control" rows={4} required maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
        </form>
      </Modal>
    </>
  );
}
