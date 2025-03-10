import * as nodemailer from 'nodemailer';

export const sendVerifyMail = async (email: string, verificationLink: string) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
    }
    console.log("Nodemailer:", nodemailer);


    console.log("Email:", email);
    console.log("Verification Link:", verificationLink);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Transporter created:", !!transporter);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Click the button below to verify your email address and complete your account setup:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Verify Email</a>
          <p>If you did not request this, you can ignore this email.</p>
          <p>Thanks, <br/>Your Company Name</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully!");
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    return false;
  }
};

   
