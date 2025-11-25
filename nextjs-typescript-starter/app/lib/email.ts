import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = `${appUrl}/verify?token=${token}`;

  // Log for development
  console.log('--------------------------------------------------');
  console.log(`To: ${email}`);
  console.log(`Subject: Verify your Packpal account`);
  console.log(`Click here to verify: ${link}`);
  console.log('--------------------------------------------------');

  // If SMTP credentials are provided, send real email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"PackPal" <no-reply@packpal.fit>',
        to: email,
        subject: 'Verify your PackPal account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to PackPal! ✈️</h2>
            <p>Please verify your email address to get started.</p>
            <p>
              <a href="${link}" style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
            </p>
            <p style="font-size: 12px; color: #666;">
              Or copy and paste this link: <br />
              <a href="${link}">${link}</a>
            </p>
          </div>
        `,
      });
      console.log('Verification email sent via SMTP');
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  }
}
