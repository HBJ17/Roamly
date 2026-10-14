import { useCallback, useState } from 'react';
import api from '../../api/client';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(script);
    return undefined;
  });

/**
 * Runs an online payment for an order created by the API.
 * Razorpay opens its own checkout; the sandbox resolves through `sandbox` state
 * so the page can show its own confirm/decline dialog.
 */
export default function usePayment() {
  const [sandbox, setSandbox] = useState(null);

  const verify = (order, result) =>
    api.post('/payments/verify', {
      paymentId: order.paymentId,
      orderId: result.orderId,
      providerPaymentId: result.paymentId,
      signature: result.signature,
      method: result.method
    });

  const pay = useCallback(async (order, { description, prefill } = {}) => {
    if (order.provider === 'razorpay') {
      const Razorpay = await loadRazorpay();
      return new Promise((resolve, reject) => {
        const rzp = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'Roamly',
          description,
          prefill,
          theme: { color: '#000000' },
          handler: (resp) =>
            verify(order, { orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature })
              .then(resolve, reject),
          modal: {
            ondismiss: () => {
              api.post('/payments/fail', { paymentId: order.paymentId, reason: 'Checkout closed' }).catch(() => {});
              reject(new Error('Payment was cancelled'));
            }
          }
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')));
        rzp.open();
      });
    }

    // Sandbox: wait for the traveller to confirm in our dialog.
    return new Promise((resolve, reject) => {
      setSandbox({
        order,
        description,
        approve: async () => {
          try {
            const auth = await api.post('/payments/sandbox/authorize', { paymentId: order.paymentId });
            const res = await verify(order, { ...auth.data.data, method: 'sandbox' });
            setSandbox(null);
            resolve(res);
          } catch (err) {
            setSandbox(null);
            reject(err);
          }
        },
        decline: () => {
          api.post('/payments/fail', { paymentId: order.paymentId, reason: 'Declined in sandbox' }).catch(() => {});
          setSandbox(null);
          reject(new Error('Payment was declined'));
        }
      });
    });
  }, []);

  return { pay, sandbox };
}
