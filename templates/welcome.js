module.exports = function welcomeTemplate({ name, from_name }) {
  return {
    subject: `Welcome to ${from_name}!`,
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
    .footer { padding: 24px 32px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Welcome to ${from_name} 🎉</h1></div>
    <div class="body">
      <p style="color:#3f3f46; font-size:16px; margin-top:0;">Hi${name ? ' ' + name : ' there'},</p>
      <p style="color:#3f3f46; font-size:16px;">Thanks for signing up! We're excited to have you on board.</p>
      <p style="color:#3f3f46; font-size:16px;">If you have any questions, just reply to this email.</p>
    </div>
    <div class="footer">Sent by ${from_name}.</div>
  </div>
</body>
</html>`
  };
};