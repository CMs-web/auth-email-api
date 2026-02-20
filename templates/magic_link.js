module.exports = function magicLinkTemplate({ token, name, from_name }) {
  return {
    subject: `Your sign-in link`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #18181b; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
    .body { padding: 40px 32px; }
    .btn { display: inline-block; background: #18181b; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${from_name}</h1></div>
    <div class="body">
      <p style="color:#3f3f46; font-size:16px; margin-top:0;">Hi${name ? ' ' + name : ''},</p>
      <p style="color:#3f3f46; font-size:16px;">Click the button below to sign in. This link expires in <strong>15 minutes</strong>.</p>
      <div style="text-align:center;">
        <a href="${token}" class="btn">Sign In</a>
      </div>
      <p style="color:#71717a; font-size:13px; word-break:break-all;">Or paste this link: ${token}</p>
      <p style="color:#71717a; font-size:14px;">If you didn't request this, ignore this email.</p>
    </div>
    <div class="footer">This email was sent by ${from_name}. Do not reply.</div>
  </div>
</body>
</html>`
  };
};