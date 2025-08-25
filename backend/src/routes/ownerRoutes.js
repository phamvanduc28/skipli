const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateOwner } = require('../middleware/auth');
const { validate, schemas, validatePhoneNumber, validateAccessCode } = require('../middleware/validation');
const { dbHelpers } = require('../services/firebaseService');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const authService = require('../services/authService');
router.post('/create-access-code', 
  validatePhoneNumber,
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }
    const accessCode = smsService.generateAccessCode();
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    let owner = await dbHelpers.findOwnerByPhone(formattedPhone);
    if (!owner) {
      owner = await dbHelpers.createOwner(formattedPhone);
    }
    const codeData = authService.createAccessCodeData(accessCode);
    await dbHelpers.updateOwnerAccessCode(formattedPhone, codeData);
    try {
      await smsService.sendAccessCode(formattedPhone, accessCode);
      res.json({
        success: true,
        message: 'Access code sent successfully',
        accessCode: process.env.NODE_ENV === 'development' ? accessCode : undefined 
      });
    } catch (error) {
      console.error('SMS sending failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS. Please try again.'
      });
    }
  })
);
router.post('/validate-access-code',
  [validatePhoneNumber, validateAccessCode],
  asyncHandler(async (req, res) => {
    const { phoneNumber, accessCode } = req.body;
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    const owner = await dbHelpers.findOwnerByPhone(formattedPhone);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found'
      });
    }
    if (!owner.accessCode || !owner.accessCode.code) {
      return res.status(400).json({
        success: false,
        message: 'No access code found. Please request a new one.'
      });
    }
    if (owner.accessCode.code !== accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid access code'
      });
    }
    if (authService.isAccessCodeExpired(owner.accessCode)) {
      return res.status(400).json({
        success: false,
        message: 'Access code has expired. Please request a new one.'
      });
    }
    await dbHelpers.updateOwnerAccessCode(formattedPhone, { code: '', expiresAt: null });
    const token = authService.generateOwnerToken(owner.id, formattedPhone);
    await dbHelpers.update('owners', owner.id, { lastLogin: new Date() });
    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: owner.id,
        phoneNumber: formattedPhone,
        role: 'owner'
      }
    });
  })
);
router.get('/employees',
  authenticateOwner,
  asyncHandler(async (req, res) => {
    const employees = await dbHelpers.getAllEmployees();
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  })
);
router.post('/employees',
  [authenticateOwner, validate(schemas.employee)],
  asyncHandler(async (req, res) => {
    const { name, email, department, phoneNumber, role } = req.body;
    const existingEmployee = await dbHelpers.findEmployeeByEmail(email);
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    const employeeData = {
      name,
      email,
      department,
      phoneNumber: phoneNumber ? smsService.formatPhoneNumber(phoneNumber) : null,
      role: role || 'Employee',
      createdBy: req.user.userId
    };
    const newEmployee = await dbHelpers.createEmployee(employeeData);
    const setupToken = authService.generateSetupToken(newEmployee.id, email);
    const setupLink = `${process.env.FRONTEND_URL || 'http:
    try {
      await emailService.sendEmployeeWelcomeEmail(employeeData, setupLink);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
    }
    if (req.io) {
      req.io.emit('employee-added', {
        employee: newEmployee
      });
    }
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee,
      setupLink: process.env.NODE_ENV === 'development' ? setupLink : undefined
    });
  })
);
router.get('/employees/:id',
  authenticateOwner,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await dbHelpers.findEmployeeById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.json({
      success: true,
      data: employee
    });
  })
);
router.put('/employees/:id',
  [authenticateOwner, validate(schemas.employee)],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, department, phoneNumber, role } = req.body;
    const employee = await dbHelpers.findEmployeeById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    if (email !== employee.email) {
      const existingEmployee = await dbHelpers.findEmployeeByEmail(email);
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: 'Employee with this email already exists'
        });
      }
    }
    const updateData = {
      name,
      email,
      department,
      phoneNumber: phoneNumber ? smsService.formatPhoneNumber(phoneNumber) : null,
      role: role || 'Employee'
    };
    const updatedEmployee = await dbHelpers.updateEmployee(id, updateData);
    if (req.io) {
      req.io.emit('employee-updated', {
        employee: updatedEmployee
      });
    }
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  })
);
router.delete('/employees/:id',
  authenticateOwner,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await dbHelpers.findEmployeeById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    await dbHelpers.deactivateEmployee(id);
    if (req.io) {
      req.io.emit('employee-deleted', {
        employeeId: id
      });
    }
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  })
);
router.get('/dashboard',
  authenticateOwner,
  asyncHandler(async (req, res) => {
    const [employees, tasks] = await Promise.all([
      dbHelpers.getAllEmployees(),
      dbHelpers.getAllTasks()
    ]);
    const stats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.isActive).length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(task => task.status === 'pending').length,
      inProgressTasks: tasks.filter(task => task.status === 'in-progress').length,
      completedTasks: tasks.filter(task => task.status === 'completed').length
    };
    res.json({
      success: true,
      data: {
        stats,
        recentEmployees: employees.slice(-5),
        recentTasks: tasks.slice(-10)
      }
    });
  })
);
module.exports = router;
