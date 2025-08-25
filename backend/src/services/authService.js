const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.tokenExpiry = '24h';
  }
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.tokenExpiry 
    });
  }
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  generateOwnerToken(ownerId, phoneNumber) {
    return this.generateToken({
      userId: ownerId,
      phoneNumber,
      role: 'owner',
      type: 'owner-auth'
    });
  }
  generateEmployeeToken(employeeId, email, role = 'employee') {
    return this.generateToken({
      userId: employeeId,
      email,
      role: 'employee',
      employeeRole: role,
      type: 'employee-auth'
    });
  }
  generateSetupToken(employeeId, email) {
    return jwt.sign(
      {
        employeeId,
        email,
        type: 'account-setup'
      },
      this.jwtSecret,
      { expiresIn: '24h' } 
    );
  }
  verifySetupToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'account-setup') {
        throw new Error('Invalid setup token');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired setup token');
    }
  }
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const errors = [];
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  validateUsername(username) {
    const minLength = 3;
    const maxLength = 30;
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    const errors = [];
    if (!username) {
      errors.push('Username is required');
    } else {
      if (username.length < minLength) {
        errors.push(`Username must be at least ${minLength} characters long`);
      }
      if (username.length > maxLength) {
        errors.push(`Username must be no more than ${maxLength} characters long`);
      }
      if (!validPattern.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }
    return parts[1];
  }
  createAccessCodeData(code) {
    return {
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
    };
  }
  isAccessCodeExpired(codeData) {
    if (!codeData || !codeData.expiresAt) {
      return true;
    }
    return new Date() > new Date(codeData.expiresAt);
  }
  sanitizeUserForToken(user) {
    const { password, accessCode, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
module.exports = new AuthService();
