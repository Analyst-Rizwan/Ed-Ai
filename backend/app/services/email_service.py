# backend/app/services/email_service.py
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send a 6-digit OTP code to the given email address.
    Returns True on success, False on failure.
    Falls back to console logging if SMTP is not configured.
    """
    # If SMTP is not configured, log OTP to console (dev mode)
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP not configured. OTP for {to_email}: {otp_code}"
        )
        print(f"\n{'='*50}")
        print(f"  OTP for {to_email}: {otp_code}")
        print(f"{'='*50}\n")
        return True

    subject = "EduAI — Your Password Reset Code"
    html_body = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;
                background: #1a1a2e; color: #e8e8e8; border-radius: 16px; padding: 32px;
                border: 1px solid rgba(255,255,255,0.07);">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 22px; font-weight: 700; color: #f5c842;">
                ⚡ EduAI
            </span>
        </div>
        <h2 style="text-align: center; font-size: 18px; font-weight: 600; margin: 0 0 8px;">
            Password Reset
        </h2>
        <p style="text-align: center; color: #888; font-size: 14px; margin: 0 0 24px;">
            Use the code below to reset your password. It expires in 10 minutes.
        </p>
        <div style="text-align: center; background: #252525; border-radius: 12px;
                    padding: 20px; margin: 0 0 24px; border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-family: 'Space Mono', monospace; font-size: 32px; font-weight: 700;
                        letter-spacing: 8px; color: #7c5cfc;">
                {otp_code}
            </span>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin: 0;">
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(f"Your EduAI password reset code is: {otp_code}", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())
        logger.info(f"OTP email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False
