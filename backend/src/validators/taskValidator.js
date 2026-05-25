const Joi = require('joi');

const createTask = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).allow(''),
  project: Joi.string().hex().length(24).required(),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'completed').default('todo'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  assignee: Joi.string().hex().length(24).allow(null, ''),
  dueDate: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  estimatedHours: Joi.number().min(0).max(1000),
});

const updateTask = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().max(5000).allow(''),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'completed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  assignee: Joi.string().hex().length(24).allow(null, ''),
  dueDate: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  estimatedHours: Joi.number().min(0).max(1000),
  actualHours: Joi.number().min(0).max(1000),
  order: Joi.number().min(0),
});

const updateTaskOrder = Joi.object({
  tasks: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().hex().length(24).required(),
        status: Joi.string().valid('todo', 'in-progress', 'review', 'completed').required(),
        order: Joi.number().min(0).required(),
      })
    )
    .required(),
});

module.exports = { createTask, updateTask, updateTaskOrder };
