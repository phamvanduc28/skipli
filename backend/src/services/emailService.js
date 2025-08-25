const nodemailer = require('nodemailer');
class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }
  init() {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      if (!emailUser || !emailPass) {
        console.warn('⚠️ Email credentials not found. Email service will be disabled.');
        return;
      }
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Email service initialization error:', error);
    }
  }
  generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  async sendEmail(to, subject, htmlContent, textContent = '') {
    if (!this.transporter) {
      console.log('📧 Email simulation (Email service not configured):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${textContent || htmlContent}`);
      return { success: true, messageId: 'simulated' };
    }
    try {
      const mailOptions = {
        from: `"Skipli Task Management" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent
      };
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}, Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
  async sendAccessCodeEmail(email, accessCode) {
    const subject = 'Your Skipli Access Code';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Skipli Access Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .access-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Skipli Task Management</h1>
          </div>
          <div class="content">
            <h2>Your Access Code</h2>
            <p>Hello,</p>
            <p>You requested access to your Skipli employee account. Please use the following 6-digit code to log in:</p>
            <div class="access-code">${accessCode}</div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 10 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this code, please contact your manager</li>
            </ul>
            <p>If you have any questions, please contact your manager or IT support.</p>
            <p>Best regards,<br>The Skipli Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
      Your Skipli Access Code: ${accessCode}
      This code will expire in 10 minutes.
      Do not share this code with anyone.
      If you didn't request this code, please contact your manager.
    `;
    return await this.sendEmail(email, subject, htmlContent, textContent);
  }
  async sendEmployeeWelcomeEmail(employeeData, setupLink) {
    const subject = 'Welcome to Skipli - Set Up Your Account';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Skipli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .employee-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Skipli!</h1>
          </div>
          <div class="content">
            <h2>Account Setup Required</h2>
            <p>Hello ${employeeData.name},</p>
            <p>You have been added to the Skipli Task Management system. Please set up your account to get started.</p>
            <div class="employee-info">
              <h3>Your Details:</h3>
              <p><strong>Name:</strong> ${employeeData.name}</p>
              <p><strong>Email:</strong> ${employeeData.email}</p>
              <p><strong>Department:</strong> ${employeeData.department}</p>
              <p><strong>Role:</strong> ${employeeData.role || 'Employee'}</p>
            </div>
            <p>To complete your account setup, please click the button below:</p>
            <div style="text-align: center;">
              <a href="${setupLink}" class="button">Set Up My Account</a>
            </div>
            <p><strong>What you can do with Skipli:</strong></p>
            <ul>
              <li>View and manage your assigned tasks</li>
              <li>Update your profile information</li>
              <li>Communicate with your manager</li>
              <li>Track your work progress</li>
            </ul>
            <p><strong>Important:</strong> This setup link will expire in 24 hours. If you need a new link, please contact your manager.</p>
            <p>If you have any questions, please don't hesitate to reach out to your manager.</p>
            <p>Welcome to the team!</p>
            <p>Best regards,<br>The Skipli Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
      Welcome to Skipli!
      Hello ${employeeData.name},
      You have been added to the Skipli Task Management system.
      Your Details:
      - Name: ${employeeData.name}
      - Email: ${employeeData.email}
      - Department: ${employeeData.department}
      - Role: ${employeeData.role || 'Employee'}
      Please set up your account using this link: ${setupLink}
      This link will expire in 24 hours.
      Welcome to the team!
    `;
    return await this.sendEmail(employeeData.email, subject, htmlContent, textContent);
  }
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
module.exports = new EmailService();
