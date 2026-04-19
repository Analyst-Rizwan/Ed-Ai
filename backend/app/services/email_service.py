# backend/app/services/email_service.py
"""
Email service powered by Resend (https://resend.com).

Provides:
  - send_email()           — generic sender (any subject/body)
  - send_otp_email()       — forgot-password OTP
  - send_welcome_email()   — post-registration welcome
  - send_notification()    — generic notification helper

Falls back to console logging when RESEND_API_KEY is not set (local dev).
"""

import logging
from typing import Optional

import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Initialise Resend SDK once on module import
# ---------------------------------------------------------------------------
_resend_ready = False
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
    _resend_ready = True
else:
    logger.warning("RESEND_API_KEY not set — emails will be logged to console only.")


# ---------------------------------------------------------------------------
# Generic sender
# ---------------------------------------------------------------------------
def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    plain_body: Optional[str] = None,
) -> bool:
    """
    Send an email via Resend.
    Returns True on success, False on failure.
    Falls back to console if Resend is not configured.
    """
    if not _resend_ready:
        logger.warning(f"[DEV] Email to {to_email} | Subject: {subject}")
        print(f"\n{'='*60}")
        print(f"  📧 TO: {to_email}")
        print(f"  📋 SUBJECT: {subject}")
        print(f"  📄 BODY (plain): {plain_body or '(HTML only)'}")
        print(f"{'='*60}\n")
        return True

    try:
        params: resend.Emails.SendParams = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        if plain_body:
            params["text"] = plain_body

        email_response = resend.Emails.send(params)
        logger.info(f"Email sent to {to_email} — id={email_response.get('id', 'N/A')}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        return False


# ---------------------------------------------------------------------------
# 🔒  Forgot-password OTP email
# ---------------------------------------------------------------------------
_OTP_HTML_TEMPLATE = """\
<div style="font-family: 'Segoe UI', Inter, sans-serif; max-width: 480px; margin: 0 auto;
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


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send a 6-digit OTP code for password reset."""
    html = _OTP_HTML_TEMPLATE.format(otp_code=otp_code)
    plain = f"Your EduAI password reset code is: {otp_code}"
    return send_email(
        to_email=to_email,
        subject="EduAI — Your Password Reset Code",
        html_body=html,
        plain_body=plain,
    )


# ---------------------------------------------------------------------------
# 🎉  Welcome email (after registration)
# ---------------------------------------------------------------------------
_WELCOME_HTML_TEMPLATE = """\
<div style="font-family: 'Segoe UI', Inter, sans-serif; max-width: 480px; margin: 0 auto;
            background: #1a1a2e; color: #e8e8e8; border-radius: 16px; padding: 32px;
            border: 1px solid rgba(255,255,255,0.07);">
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 22px; font-weight: 700; color: #f5c842;">
            ⚡ EduAI
        </span>
    </div>
    <h2 style="text-align: center; font-size: 18px; font-weight: 600; margin: 0 0 8px;">
        Welcome to EduAI, {username}! 🎉
    </h2>
    <p style="text-align: center; color: #aaa; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
        Your account is all set. Dive into personalized learning paths,
        AI-powered tutoring, and hands-on coding challenges.
    </p>
    <div style="text-align: center; margin: 0 0 24px;">
        <a href="{app_url}" style="display: inline-block; background: #7c5cfc; color: #fff;
                  text-decoration: none; padding: 12px 28px; border-radius: 8px;
                  font-weight: 600; font-size: 14px;">
            Start Learning →
        </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 12px; margin: 0;">
        If you didn't create this account, please ignore this email.
    </p>
</div>
"""


def send_welcome_email(to_email: str, username: str) -> bool:
    """Send a welcome email after user registration."""
    app_url = "https://eduaiajk.in" if settings.APP_ENV == "production" else "http://localhost:5173"
    html = _WELCOME_HTML_TEMPLATE.format(username=username, app_url=app_url)
    plain = f"Welcome to EduAI, {username}! Start learning at {app_url}"
    return send_email(
        to_email=to_email,
        subject=f"Welcome to EduAI, {username}! 🎉",
        html_body=html,
        plain_body=plain,
    )


# ---------------------------------------------------------------------------
# 🔔  Generic notification email
# ---------------------------------------------------------------------------
_NOTIFICATION_HTML_TEMPLATE = """\
<div style="font-family: 'Segoe UI', Inter, sans-serif; max-width: 480px; margin: 0 auto;
            background: #1a1a2e; color: #e8e8e8; border-radius: 16px; padding: 32px;
            border: 1px solid rgba(255,255,255,0.07);">
    <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 22px; font-weight: 700; color: #f5c842;">
            ⚡ EduAI
        </span>
    </div>
    <h2 style="text-align: center; font-size: 18px; font-weight: 600; margin: 0 0 8px;">
        {title}
    </h2>
    <p style="text-align: center; color: #aaa; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
        {message}
    </p>
    <p style="text-align: center; color: #666; font-size: 12px; margin: 0;">
        — The EduAI Team
    </p>
</div>
"""


def send_notification(to_email: str, title: str, message: str) -> bool:
    """Send a generic branded notification email."""
    html = _NOTIFICATION_HTML_TEMPLATE.format(title=title, message=message)
    return send_email(
        to_email=to_email,
        subject=f"EduAI — {title}",
        html_body=html,
        plain_body=message,
    )
