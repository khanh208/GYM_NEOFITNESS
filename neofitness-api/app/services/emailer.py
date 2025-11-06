# app/services/emailer.py
import os, smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")      # ví dụ yourgmail@gmail.com
SMTP_PASS = os.getenv("SMTP_PASS")      # app password 16 ký tự
MAIL_FROM = os.getenv("MAIL_FROM", SMTP_USER)
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "NeoFitness")

def _build_message(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> EmailMessage:
    msg = EmailMessage()
    sender = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    if text_body:
        msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")
    return msg

def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None):
    if not (SMTP_USER and SMTP_PASS and MAIL_FROM):
        raise RuntimeError("SMTP is not configured. Check SMTP_USER/SMTP_PASS/MAIL_FROM in .env")
    msg = _build_message(to_email, subject, html_body, text_body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.ehlo()
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)

def send_otp_email(to_email: str, otp_code: str, purpose: str):
    """
    purpose: 'verify_email' | 'reset_password'
    """
    if purpose == "verify_email":
        subject = "NeoFitness - Mã xác thực email"
        intro = "Cảm ơn bạn đã đăng ký NeoFitness."
        action = "Xác thực email"
    else:
        subject = "NeoFitness - Mã đặt lại mật khẩu"
        intro = "Bạn vừa yêu cầu đặt lại mật khẩu tài khoản NeoFitness."
        action = "Đặt lại mật khẩu"

    html = f"""
    <div style="font-family:Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
      <h2 style="margin:0 0 8px">NeoFitness</h2>
      <p>{intro}</p>
      <p>Mã OTP của bạn là:</p>
      <div style="font-size:28px;font-weight:800;letter-spacing:4px;margin:8px 0 12px">{otp_code}</div>
      <p>Mã sẽ hết hạn sau <b>10 phút</b>. Không chia sẻ mã này cho bất cứ ai.</p>
      <p>Nếu không phải bạn thực hiện, hãy bỏ qua email này.</p>
      <hr style="border:none;height:1px;background:#eee;margin:16px 0" />
      <p style="color:#666">NeoFitness Support</p>
    </div>
    """
    text = f"{intro}\n\nOTP: {otp_code}\nHết hạn sau 10 phút.\nKhông chia sẻ mã này."
    send_email(to_email, subject, html, text)
