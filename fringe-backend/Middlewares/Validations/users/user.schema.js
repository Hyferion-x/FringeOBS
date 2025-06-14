const Joi = require('joi');

const schema = {
  user: Joi.object({
    name: Joi.string().min(3).max(20).required().messages({
      'string.base': 'Name should be text',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name should be at least {#limit} characters',
      'string.max': 'Name should not exceed {#limit} characters',
      'any.required': 'Name is required',
    }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email should be text',
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email cannot be empty',
        'any.required': 'Email is required',
      }),

    password: Joi.string()
      .min(3)
      .max(20)
      .required(),

    role: Joi.string().valid('admin', 'customer')
      .messages({
        'any.only': 'Role must be either admin or customer'
      })
  }),
};

module.exports = schema;
