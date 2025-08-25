const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateEmployee } = require('../middleware/auth');
const { validate, schemas, validateEmail, validateAccessCode } = require('../middleware/validation');
const { dbHelpers } = require('../services/firebaseService');
const emailService = require('../services/emailService');
const authService = require('../services/authService');
router.post('/login-email',
  validateEmail,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const employee = await dbHelpers.findEmployeeByEmail(email);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee found with this email address'
      });
    }
    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Employee account is inactive. Please contact your manager.'
      });
    }
    const accessCode = emailService.generateAccessCode();
    const codeData = authService.createAccessCodeData(accessCode);
    await dbHelpers.updateEmployee(employee.id, { accessCode: codeData });
    try {
      await emailService.sendAccessCodeEmail(email, accessCode);
      res.json({
        success: true,
        message: 'Access code sent to your email',
        accessCode: process.env.NODE_ENV === 'development' ? accessCode : undefined 
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again.'
      });
    }
  })
);
router.post('/validate-access-code',
  [validateEmail, validateAccessCode],
  asyncHandler(async (req, res) => {
    const { email, accessCode } = req.body;
    const employee = await dbHelpers.findEmployeeByEmail(email);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Employee account is inactive'
      });
    }
    if (!employee.accessCode || !employee.accessCode.code) {
      return res.status(400).json({
        success: false,
        message: 'No access code found. Please request a new one.'
      });
    }
    if (employee.accessCode.code !== accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid access code'
      });
    }
    if (authService.isAccessCodeExpired(employee.accessCode)) {
      return res.status(400).json({
        success: false,
        message: 'Access code has expired. Please request a new one.'
      });
    }
    await dbHelpers.updateEmployee(employee.id, { 
      accessCode: { code: '', expiresAt: null },
      lastLogin: new Date()
    });
    const credentials = await dbHelpers.findCredentialsByEmployeeId(employee.id);
    if (!credentials) {
      const setupToken = authService.generateSetupToken(employee.id, email);
      return res.json({
        success: true,
        requiresSetup: true,
        message: 'Please set up your account credentials',
        setupToken,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email
        }
      });
    }
    const token = authService.generateEmployeeToken(employee.id, email, employee.role);
    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: 'employee'
      }
    });
  })
);
router.post('/setup-account',
  validate(schemas.credentials),
  asyncHandler(async (req, res) => {
    const { setupToken, username, password } = req.body;
    if (!setupToken) {
      return res.status(400).json({
        success: false,
        message: 'Setup token is required'
      });
    }
    try {
      const decoded = authService.verifySetupToken(setupToken);
      const { employeeId, email } = decoded;
      const passwordValidation = authService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }
      const existingCredentials = await dbHelpers.findCredentialsByUsername(username);
      if (existingCredentials) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      const hashedPassword = await authService.hashPassword(password);
      const credentialsData = {
        employeeId,
        username,
        password: hashedPassword
      };
      await dbHelpers.createEmployeeCredentials(employeeId, credentialsData);
      const employee = await dbHelpers.findEmployeeById(employeeId);
      const token = authService.generateEmployeeToken(employeeId, email, employee.role);
      res.status(201).json({
        success: true,
        message: 'Account setup completed successfully',
        token,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          role: 'employee'
        }
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired setup token'
      });
    }
  })
);
router.post('/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    const credentials = await dbHelpers.findCredentialsByUsername(username);
    if (!credentials) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    const isPasswordValid = await authService.comparePassword(password, credentials.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    const employee = await dbHelpers.findEmployeeById(credentials.employeeId);
    if (!employee || !employee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Employee account is inactive'
      });
    }
    await dbHelpers.updateEmployee(employee.id, { lastLogin: new Date() });
    const token = authService.generateEmployeeToken(employee.id, employee.email, employee.role);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: 'employee'
      }
    });
  })
);
router.get('/profile',
  authenticateEmployee,
  asyncHandler(async (req, res) => {
    const employee = await dbHelpers.findEmployeeById(req.user.userId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.json({
      success: true,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        phoneNumber: employee.phoneNumber,
        role: employee.role,
        createdAt: employee.createdAt,
        lastLogin: employee.lastLogin
      }
    });
  })
);
router.put('/profile',
  [authenticateEmployee, validate(schemas.profileUpdate)],
  asyncHandler(async (req, res) => {
    const { name, phoneNumber, department, role } = req.body;
    const employeeId = req.user.userId;
    const employee = await dbHelpers.findEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    const updateData = {};
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (department) updateData.department = department;
    if (role) updateData.role = role;
    const updatedEmployee = await dbHelpers.updateEmployee(employeeId, updateData);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        department: updatedEmployee.department,
        phoneNumber: updatedEmployee.phoneNumber,
        role: updatedEmployee.role
      }
    });
  })
);
router.get('/tasks',
  authenticateEmployee,
  asyncHandler(async (req, res) => {
    const employeeId = req.user.userId;
    const tasks = await dbHelpers.findTasksByEmployee(employeeId);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  })
);
router.put('/tasks/:id/status',
  authenticateEmployee,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const employeeId = req.user.userId;
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, in-progress, completed'
      });
    }
    const task = await dbHelpers.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    if (task.assignedTo !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update tasks assigned to you'
      });
    }
    const updatedTask = await dbHelpers.updateTask(id, { status });
    if (req.io) {
      req.io.emit('task-status-updated', {
        task: updatedTask,
        updatedBy: employeeId
      });
    }
    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  })
);
router.get('/dashboard',
  authenticateEmployee,
  asyncHandler(async (req, res) => {
    const employeeId = req.user.userId;
    const tasks = await dbHelpers.findTasksByEmployee(employeeId);
    const stats = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(task => task.status === 'pending').length,
      inProgressTasks: tasks.filter(task => task.status === 'in-progress').length,
      completedTasks: tasks.filter(task => task.status === 'completed').length
    };
    res.json({
      success: true,
      data: {
        stats,
        recentTasks: tasks.slice(-10)
      }
    });
  })
);
module.exports = router;
