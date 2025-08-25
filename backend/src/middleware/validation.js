const Joi = require('joi');
const schemas = {
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in valid international format',
      'any.required': 'Phone number is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  accessCode: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Access code must be exactly 6 digits',
      'string.pattern.base': 'Access code must contain only numbers',
      'any.required': 'Access code is required'
    }),
  employee: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be no more than 100 characters long',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    department: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Department must be at least 2 characters long',
      'string.max': 'Department must be no more than 50 characters long',
      'any.required': 'Department is required'
    }),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Phone number must be in valid international format'
    }),
    role: Joi.string().max(50).optional().messages({
      'string.max': 'Role must be no more than 50 characters long'
    })
  }),
  task: Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Task title must be at least 3 characters long',
      'string.max': 'Task title must be no more than 200 characters long',
      'any.required': 'Task title is required'
    }),
    description: Joi.string().max(1000).optional().allow('').messages({
      'string.max': 'Task description must be no more than 1000 characters long'
    }),
    assignedTo: Joi.string().required().messages({
      'any.required': 'Task must be assigned to an employee'
    }),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium').messages({
      'any.only': 'Priority must be one of: low, medium, high'
    }),
    dueDate: Joi.date().min('now').optional().messages({
      'date.min': 'Due date cannot be in the past'
    }),
    status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending').messages({
      'any.only': 'Status must be one of: pending, in-progress, completed'
    })
  }),
  credentials: Joi.object({
    username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_-]+$/).required().messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must be no more than 30 characters long',
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
      'any.required': 'Username is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    })
  }),
  message: Joi.object({
    toUserId: Joi.string().required().messages({
      'any.required': 'Recipient user ID is required'
    }),
    message: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must be no more than 1000 characters long',
      'any.required': 'Message content is required'
    }),
    type: Joi.string().valid('text', 'image', 'file').default('text').messages({
      'any.only': 'Message type must be one of: text, image, file'
    })
  }),
  profileUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be no more than 100 characters long'
    }),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
      'string.pattern.base': 'Phone number must be in valid international format'
    }),
    department: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Department must be at least 2 characters long',
      'string.max': 'Department must be no more than 50 characters long'
    }),
    role: Joi.string().max(50).optional().messages({
      'string.max': 'Role must be no more than 50 characters long'
    })
  })
};
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    next();
  };
};
const validatePhoneNumber = (req, res, next) => {
  const { error } = schemas.phoneNumber.validate(req.body.phoneNumber);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
const validateEmail = (req, res, next) => {
  const { error } = schemas.email.validate(req.body.email);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
const validateAccessCode = (req, res, next) => {
  const { error } = schemas.accessCode.validate(req.body.accessCode);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
module.exports = {
  validate,
  schemas,
  validatePhoneNumber,
  validateEmail,
  validateAccessCode
};
