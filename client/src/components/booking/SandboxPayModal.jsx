import React from 'react';
import { FlaskConical } from 'lucide-react';
import { Modal } from '../ui';
import { useApp } from '../../context/AppContext';

// Stand-in for the Razorpay window when the API runs without gateway keys (development only).
export default function SandboxPayModal({ sandbox }) {
  const { formatCurrency } = useApp();
  if (!sandbox) return null;
  return (
    <Modal open title="Test payment" onClose={sandbox.decline} width={420}>
      <div className="alert alert-info"><FlaskConical size={14} /> Sandbox mode: no real money moves. Add Razorpay test keys on the server to use the real checkout.</div>
      <p className="small muted">{sandbox.description}</p>
      <p className="price" style={{ fontSize: 26, margin: '10px 0 16px' }}>{formatCurrency(sandbox.order.amount / 100)}</p>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={sandbox.approve}>Pay now</button>
        <button type="button" className="btn btn-danger" onClick={sandbox.decline}>Simulate failure</button>
      </div>
    </Modal>
  );
}
