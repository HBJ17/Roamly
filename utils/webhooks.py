"""Outbound event webhooks for n8n automation (booking emails, payout alerts, etc)."""

import hmac
import hashlib
import json
import threading
from datetime import datetime, timezone

import requests

from config import Config


def _post_event(event_type: str, data: dict):
    if not Config.N8N_WEBHOOK_URL:
        return

    body = json.dumps({
        'event': event_type,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'data': data
    }, default=str)

    headers = {'Content-Type': 'application/json'}
    if Config.N8N_WEBHOOK_SECRET:
        signature = hmac.new(
            Config.N8N_WEBHOOK_SECRET.encode('utf-8'),
            body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        headers['X-Roamly-Signature'] = signature

    try:
        requests.post(Config.N8N_WEBHOOK_URL, data=body, headers=headers, timeout=Config.N8N_WEBHOOK_TIMEOUT)
    except requests.RequestException:
        pass


def send_event(event_type: str, data: dict):
    """Fire an automation event to n8n without blocking the request thread.

    Safe to call even when N8N_WEBHOOK_URL is unset (no-op) or unreachable
    (failures are swallowed so a down n8n instance never breaks a booking flow).
    """
    thread = threading.Thread(target=_post_event, args=(event_type, data), daemon=True)
    thread.start()
