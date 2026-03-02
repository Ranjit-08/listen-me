const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const emailHTML = (title, body) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Georgia,serif;background:#05050a;margin:0;padding:40px 20px;}
  .wrap{max-width:460px;margin:0 auto;background:#0d0d15;border:1px solid rgba(201,168,76,0.2);border-radius:16px;overflow:hidden;}
  .hdr{background:linear-gradient(135deg,#1a1208,#0d0d15);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.15);}
  .logo{font-size:30px;letter-spacing:12px;color:#c9a84c;}
  .sub{font-size:10px;letter-spacing:4px;color:#7a7060;margin-top:6px;}
  .bdy{padding:32px;color:#d0c8b0;}
  .bdy h2{color:#f0ece0;font-size:18px;font-weight:400;margin-bottom:10px;}
  .bdy p{font-size:13px;line-height:1.6;color:#9a9280;margin-bottom:12px;}
  .otp{background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:10px;padding:18px;text-align:center;margin:20px 0;}
  .code{font-size:34px;letter-spacing:10px;color:#c9a84c;font-family:monospace;}
  .ftr{padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);font-size:11px;color:#4a4840;text-align:center;}
</style></head><body>
<div class="wrap">
  <div class="hdr"><div class="logo">AURA</div><div class="sub">FEEL EVERY NOTE</div></div>
  <div class="bdy"><h2>${title}</h2>${body}</div>
  <div class="ftr">Code expires in ${process.env.OTP_EXPIRES_MINUTES||10} minutes. If you didn't request this, ignore this email.</div>
</div></body></html>`;

const sendOTP = async (email, otp, type = 'verify') => {
  const isReset  = type === 'reset';
  const subject  = isReset ? 'AURA – Reset Your Password' : 'AURA – Verify Your Email';
  const title    = isReset ? 'Password Reset Code'        : 'Email Verification Code';
  const body     = `<p>${isReset ? 'We received a request to reset your password.' : 'Welcome to AURA! Verify your email to complete registration.'}</p>
    <p>Your code is:</p>
    <div class="otp"><div class="code">${otp}</div></div>
    <p>Valid for <strong style="color:#c9a84c;">${process.env.OTP_EXPIRES_MINUTES||10} minutes</strong>.</p>`;

  await transporter.sendMail({
    from:    `"AURA Music" <${process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html:    emailHTML(title, body),
  });
};

module.exports = { sendOTP, generateOTP };