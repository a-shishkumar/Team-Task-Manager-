const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

/**
 * Email service for sending transactional emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: false,
      auth: config.email.smtp.auth,
    });
  }

  /**
   * Send an email
   */
  async send(to, subject, html) {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Email send failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email, name, token) {
    const verifyUrl = `${config.clientUrl}/verify-email/${token}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Team Task Manager</h1>
        </div>
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${name}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for signing up. Please verify your email address to get started.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `;
    return this.send(email, 'Verify Your Email - Team Task Manager', html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${config.clientUrl}/reset-password/${token}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You requested a password reset. Click the button below to set a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `;
    return this.send(email, 'Password Reset - Team Task Manager', html);
  }

  /**
   * Send task assignment notification
   */
  async sendTaskAssignmentEmail(email, name, taskTitle, projectName, assignedBy) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Task Assigned</h1>
        </div>
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e8e8e8; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have been assigned a new task:
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Task:</strong> ${taskTitle}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Project:</strong> ${projectName}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Assigned by:</strong> ${assignedBy}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.clientUrl}/dashboard" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
              View Task
            </a>
          </div>
        </div>
      </div>
    `;
    return this.send(email, `New Task: ${taskTitle} - Team Task Manager`, html);
  }
}

module.exports = new EmailService();
