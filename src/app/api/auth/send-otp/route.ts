import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { email, subject } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    if (db) {
      await setDoc(doc(db, 'otps', email.toLowerCase()), {
        otp,
        expiresAt,
      });
    } else {
      console.warn("Firestore not initialized, cannot save OTP.");
    }

    // SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailSubject = subject || 'Your Authorization OTP';

    await transporter.sendMail({
      from: `IndianToolsHub <${process.env.SMTP_USER}>`,
      to: email,
      subject: mailSubject,
      text: `Your One-Time Password (OTP) is: ${otp}\n\nIt will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #FF9933;">IndianToolsHub</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #128807; background: #f9f9f9; padding: 10px; text-align: center; border-radius: 4px;">${otp}</h1>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">If you did not request this, please safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("OTP Send Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
