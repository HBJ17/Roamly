"""Transactional Email & Communication Service with SendGrid/SMTP support and database logging."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import Config
from database.connection import get_db_connection

def generate_booking_email_html(booking: dict, item: dict, invoice: dict, user: dict) -> str:
    """Generate responsive, luxury HTML email voucher and tax receipt."""
    ref_code = f"#ROAM-{booking['booking_type'][:3].upper()}-{booking['id']:04d}"
    item_title = item.get('title') or item.get('name') or 'Travel Service'
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; color: #0f172a; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }}
            .header {{ background: #0b192c; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 24px; }}
            .badge {{ display: inline-block; background: #e85d04; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }}
            .box {{ background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; }}
            .row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }}
            .total {{ font-size: 18px; font-weight: bold; color: #e85d04; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; }}
            .footer {{ background: #0b192c; color: #94a3b8; text-align: center; padding: 16px; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Roamly Travel Pro</h1>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Official Reservation Confirmation & Tax Invoice</p>
            </div>
            <div class="content">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge">{booking['booking_type']} Confirmed</span>
                    <span style="font-weight: bold; color: #0b192c;">{ref_code}</span>
                </div>
                
                <p>Dear <strong>{user.get('full_name') or user.get('username', 'Traveler')}</strong>,</p>
                <p>Your reservation for <strong>{item_title}</strong> is confirmed. Below are your travel details and electronic receipt.</p>
                
                <div class="box">
                    <div class="row"><span>Travel Date:</span><strong>{booking.get('travel_date')}</strong></div>
                    {f'<div class="row"><span>Check-out Date:</span><strong>{booking.get("check_out_date")}</strong></div>' if booking.get('check_out_date') else ''}
                    <div class="row"><span>Travelers:</span><strong>{booking.get('num_travelers', 1)} Person(s)</strong></div>
                    <div class="row"><span>Invoice Number:</span><strong>{invoice.get('invoice_number', 'INV-2026-0001')}</strong></div>
                    <div class="row"><span>Payment Status:</span><strong style="color: #10b981;">Paid in Full</strong></div>
                    <div class="row total"><span>Total Amount Paid:</span><span>₹{booking.get('total_price', 0):,.2f}</span></div>
                </div>
                
                <p style="font-size: 13px; color: #64748b;">
                    Please present your digital QR pass from the Roamly app upon arrival. For assistance, reply directly to this confirmation.
                </p>
            </div>
            <div class="footer">
                &copy; 2026 Roamly Travel Technologies Pvt Ltd. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    return html

def send_transactional_email(recipient_email: str, subject: str, body_html: str, booking_id: int = None) -> bool:
    """Send transactional email via configured SMTP/SendGrid or log to database."""
    # Log to database email_logs table
    if booking_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO email_logs (booking_id, recipient_email, subject, body_html)
                VALUES (%s, %s, %s, %s)
            ''', (booking_id, recipient_email, subject, body_html))
            conn.commit()
            conn.close()
        except Exception:
            pass

    # Attempt live SMTP if valid credentials configured
    if Config.MAIL_SERVER and Config.MAIL_PASSWORD and not Config.MAIL_PASSWORD.startswith('SG.sample_placeholder'):
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = Config.MAIL_DEFAULT_SENDER
            msg['To'] = recipient_email
            msg.attach(MIMEText(body_html, 'html'))

            with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
                if Config.MAIL_USE_TLS:
                    server.starttls()
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                server.sendmail(Config.MAIL_DEFAULT_SENDER, [recipient_email], msg.as_string())
            return True
        except Exception as e:
            print(f"SMTP dispatch notice: {e}")
            return False
            
    return True
