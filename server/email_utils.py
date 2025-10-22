import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT') or 587)
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASS = os.getenv('SMTP_PASS')
SMTP_FROM = os.getenv('SMTP_FROM') or SMTP_USER or 'no-reply@fithub.com'


from typing import Optional


def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
    """Send an email with optional HTML body. Returns True on success, False otherwise.
    If SMTP env is not configured, returns False silently.
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print(f"❌ SMTP not configured: HOST={bool(SMTP_HOST)}, USER={bool(SMTP_USER)}, PASS={bool(SMTP_PASS)}")
        return False
    
    try:
        # Create message with HTML support
        if html_body:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = SMTP_FROM
            msg['To'] = to_email
            
            # Attach both plain text and HTML versions
            part1 = MIMEText(body, 'plain', 'utf-8')
            part2 = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(part1)
            msg.attach(part2)
        else:
            msg = MIMEText(body, 'plain', 'utf-8')
            msg['Subject'] = subject
            msg['From'] = SMTP_FROM
            msg['To'] = to_email

        # Send via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.set_debuglevel(0)  # Set to 1 for debugging
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Email send failed to {to_email}: {str(e)}")
        return False
