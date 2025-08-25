const twilio = require('twilio');
class SmsService {
  constructor() {
    this.client = null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.init();
  }
  init() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken || !this.fromNumber) {
        console.warn('⚠️ Twilio credentials not found. SMS service will be disabled.');
        return;
      }
      this.client = twilio(accountSid, authToken);
      console.log('✅ Twilio SMS service initialized');
    } catch (error) {
      console.error('❌ Twilio initialization error:', error);
    }
  }
  generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  async sendSms(to, message) {
    if (!this.client) {
      console.log('📱 SMS simulation (Twilio not configured):');
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      return { success: true, sid: 'simulated' };
    }
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const messageResult = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber
      });
      console.log(`✅ SMS sent successfully to ${formattedNumber}, SID: ${messageResult.sid}`);
      return { success: true, sid: messageResult.sid };
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
  async sendAccessCode(phoneNumber, accessCode) {
    const message = `Your Skipli access code is: ${accessCode}. This code will expire in 10 minutes.`;
    return await this.sendSms(phoneNumber, message);
  }
  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
      return `+${cleaned}`;
    }
    return phoneNumber;
  }
  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const formatted = this.formatPhoneNumber(phoneNumber);
    return phoneRegex.test(formatted);
  }
}
module.exports = new SmsService();
