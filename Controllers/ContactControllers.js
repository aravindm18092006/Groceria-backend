const nodemailer = require('nodemailer');

// @desc   Send contact form message to admin email
// @route  POST /api/contact
const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,       // use STARTTLS
      requireTLS: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    // Email to admin
    await transporter.sendMail({
      from: `"Groceria Support" <${process.env.MAIL_USER}>`,
      to: 'aravindm180906@gmail.com',
      replyTo: email,
      subject: `[Groceria] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
          <div style="background:#1976d2;color:white;padding:20px;">
            <h2 style="margin:0;">?? New Contact Message</h2>
          </div>
          <div style="padding:24px;">
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
            <p><strong>Message:</strong></p>
            <p style="background:#f9f9f9;padding:16px;border-radius:6px;white-space:pre-wrap;">${message}</p>
          </div>
          <div style="background:#f5f5f5;padding:12px 24px;font-size:12px;color:#888;">
            Sent via Groceria Contact Form &middot; groceriasupport@gmail.com &middot; 9080425338
          </div>
        </div>
      `,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"Groceria Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `We received your message — Groceria`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
          <div style="background:#1976d2;color:white;padding:20px;">
            <h2 style="margin:0;">Thank you, ${name}!</h2>
          </div>
          <div style="padding:24px;">
            <p>We received your message about <strong>"${subject}"</strong> and will get back to you within 24 hours.</p>
            <p style="color:#888;font-size:13px;">?? groceriasupport@gmail.com &nbsp;|&nbsp; ?? 9080425338</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Mail error:', error.code, error.message);
    // Still return success so the message is saved on frontend
    res.status(500).json({ success: false, message: 'Mail delivery failed: ' + error.message });
  }
};

module.exports = { sendContactMessage };
