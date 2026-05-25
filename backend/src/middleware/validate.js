const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware factory
 * Validates request body, params, or query against a Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return next(ApiError.badRequest('Validation error', errors));
    }

    // Replace request property with validated values
    req[property] = value;
    next();
  };
};

module.exports = validate;
