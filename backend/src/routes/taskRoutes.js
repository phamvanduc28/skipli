const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateAny, authenticateOwner } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { dbHelpers } = require('../services/firebaseService');
router.get('/',
  authenticateAny,
  asyncHandler(async (req, res) => {
    let tasks;
    if (req.user.role === 'owner') {
      tasks = await dbHelpers.getAllTasks();
    } else {
      tasks = await dbHelpers.findTasksByEmployee(req.user.userId);
    }
    const tasksWithEmployeeDetails = await Promise.all(
      tasks.map(async (task) => {
        if (task.assignedTo) {
          const employee = await dbHelpers.findEmployeeById(task.assignedTo);
          return {
            ...task,
            assignedEmployee: employee ? {
              id: employee.id,
              name: employee.name,
              email: employee.email,
              department: employee.department
            } : null
          };
        }
        return task;
      })
    );
    res.json({
      success: true,
      data: tasksWithEmployeeDetails,
      count: tasksWithEmployeeDetails.length
    });
  })
);
router.get('/:id',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = await dbHelpers.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    if (req.user.role === 'employee' && task.assignedTo !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view tasks assigned to you'
      });
    }
    let taskWithDetails = { ...task };
    if (task.assignedTo) {
      const employee = await dbHelpers.findEmployeeById(task.assignedTo);
      taskWithDetails.assignedEmployee = employee ? {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department
      } : null;
    }
    res.json({
      success: true,
      data: taskWithDetails
    });
  })
);
router.post('/',
  [authenticateOwner, validate(schemas.task)],
  asyncHandler(async (req, res) => {
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const employee = await dbHelpers.findEmployeeById(assignedTo);
    if (!employee || !employee.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Assigned employee not found or inactive'
      });
    }
    const taskData = {
      title,
      description: description || '',
      assignedTo,
      createdBy: req.user.userId,
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : null
    };
    const newTask = await dbHelpers.createTask(taskData);
    const taskWithDetails = {
      ...newTask,
      assignedEmployee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department
      }
    };
    if (req.io) {
      req.io.emit('new-task-assigned', {
        task: taskWithDetails,
        assignedTo: assignedTo
      });
    }
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: taskWithDetails
    });
  })
);
router.put('/:id',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const task = await dbHelpers.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    if (req.user.role === 'employee') {
      if (task.assignedTo !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you'
        });
      }
      const allowedFields = ['status'];
      const updateFields = Object.keys(updates);
      const hasDisallowedFields = updateFields.some(field => !allowedFields.includes(field));
      if (hasDisallowedFields) {
        return res.status(403).json({
          success: false,
          message: 'Employees can only update task status'
        });
      }
      if (updates.status && !['pending', 'in-progress', 'completed'].includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
    } else {
      if (updates.assignedTo && updates.assignedTo !== task.assignedTo) {
        const employee = await dbHelpers.findEmployeeById(updates.assignedTo);
        if (!employee || !employee.isActive) {
          return res.status(404).json({
            success: false,
            message: 'Assigned employee not found or inactive'
          });
        }
      }
      if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority value'
        });
      }
      if (updates.status && !['pending', 'in-progress', 'completed'].includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      if (updates.dueDate) {
        updates.dueDate = new Date(updates.dueDate);
      }
    }
    const updatedTask = await dbHelpers.updateTask(id, updates);
    let taskWithDetails = { ...updatedTask };
    if (updatedTask.assignedTo) {
      const employee = await dbHelpers.findEmployeeById(updatedTask.assignedTo);
      taskWithDetails.assignedEmployee = employee ? {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department
      } : null;
    }
    if (req.io) {
      req.io.emit('task-updated', {
        task: taskWithDetails,
        updatedBy: req.user.userId,
        updatedByRole: req.user.role
      });
    }
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: taskWithDetails
    });
  })
);
router.delete('/:id',
  authenticateOwner,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = await dbHelpers.findTaskById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    await dbHelpers.deleteTask(id);
    if (req.io) {
      req.io.emit('task-deleted', {
        taskId: id,
        assignedTo: task.assignedTo
      });
    }
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  })
);
router.get('/employee/:employeeId',
  authenticateOwner,
  asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const employee = await dbHelpers.findEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    const tasks = await dbHelpers.findTasksByEmployee(employeeId);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department
      }
    });
  })
);
router.get('/stats/overview',
  authenticateAny,
  asyncHandler(async (req, res) => {
    let tasks;
    if (req.user.role === 'owner') {
      tasks = await dbHelpers.getAllTasks();
    } else {
      tasks = await dbHelpers.findTasksByEmployee(req.user.userId);
    }
    const stats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length
      }
    };
    const now = new Date();
    stats.overdue = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed'
    ).length;
    res.json({
      success: true,
      data: stats
    });
  })
);
module.exports = router;
