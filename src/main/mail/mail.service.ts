/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendWelcomeEmail(
    email: string,
    fullName: string,
    plainPassword: string,
  ) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); color: #333;">
      
      <div style="background-color: #2B4C8A; padding: 30px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800;">PCR REGISTRY</h1>
        <div style="height: 2px; width: 60px; background-color: #D4AF37; margin: 10px auto;"></div>
      </div>
      
      <div style="padding: 40px;">
        <h2 style="color: #2B4C8A; margin-top: 0;">Welcome, ${fullName}!</h2>
        <p style="line-height: 1.6; color: #555;">Your professional account has been successfully created by the PCR Administration. You can now access the registry with the following credentials:</p>
        
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 25px; margin: 30px 0; border-left: 5px solid #D4AF37; border-right: 1px solid #eee; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding-bottom: 10px; color: #2B4C8A; font-weight: bold;">Email Address:</td>
              <td style="padding-bottom: 10px;">${email}</td>
            </tr>
            <tr>
              <td style="color: #2B4C8A; font-weight: bold;">Temporary Password:</td>
              <td style="font-family: monospace; font-size: 16px; color: #333; font-weight: bold;">${plainPassword}</td>
            </tr>
          </table>
        </div>

        <div style="display: flex; align-items: flex-start; background-color: #fff9e6; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
          <span style="font-size: 20px; margin-right: 10px;">🛡️</span>
          <p style="margin: 0; font-size: 14px; color: #7a5f00;">
            <strong>Security Priority:</strong> For your protection, you will be required to change this temporary password immediately after your first login.
          </p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${loginUrl}" style="background-color: #2B4C8A; color: #ffffff; padding: 16px 45px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(43, 76, 138, 0.2);">Access Your Portal</a>
        </div>

        <p style="font-size: 14px; color: #777; line-height: 1.5;">If you have any questions or did not expect this account, please contact our support team immediately.</p>
      </div>

      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          &copy; ${new Date().getFullYear()} PCR Registry. All rights reserved.<br>
          This is an automated administrative notification.
        </p>
      </div>
    </div>
  `;

    await this.transporter.sendMail({
      from: `"PCR Administration" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Access Granted: Your PCR Registry Credentials',
      html: htmlContent,
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); color: #333;">
      
      <div style="background-color: #2B4C8A; padding: 25px; text-align: center;">
        <h2 style="color: #D4AF37; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">PCR REGISTRY</h2>
      </div>
      
      <div style="padding: 40px; text-align: center;">
        <h3 style="color: #2B4C8A; margin-top: 0;">Verify Your Email</h3>
        <p style="line-height: 1.6; color: #555;">Please use the following One-Time Password (OTP) to complete your registration. This code is valid for <strong>10 minutes</strong>.</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border: 2px dashed #D4AF37; border-radius: 10px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2B4C8A;">${otp}</span>
        </div>

        <p style="font-size: 13px; color: #888;">If you did not request this code, please ignore this email.</p>
      </div>

      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="font-size: 11px; color: #999; margin: 0;">
          &copy; ${new Date().getFullYear()} PCR Registry. Secure Verification System.
        </p>
      </div>
    </div>
    `;

    await this.transporter.sendMail({
      from: `"PCR Security" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html: htmlContent,
    });
  }
}
