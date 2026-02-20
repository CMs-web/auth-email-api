module.exports = function otpTemplate({ to, token, name, from_name }) {
  return {
    subject: `Your verification code is ${token}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #18181b; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
    .body { padding: 40px 32px; }
    .otp-box { background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; letter-spacing: 12px; font-size: 36px; font-weight: 700; color: #18181b; font-family: monospace; }
    .footer { padding: 24px 32px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${from_name}</h1></div>
    <div class="body">
      <p style="color:#3f3f46; font-size:16px; margin-top:0;">Hi${name ? ' ' + name : ''},</p>
      <p style="color:#3f3f46; font-size:16px;">Use the code below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
      <div class="otp-box">${token}</div>
      <p style="color:#71717a; font-size:14px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">This email was sent by ${from_name}. Do not reply.</div>
  </div>
</body>
</html>`
  };
};