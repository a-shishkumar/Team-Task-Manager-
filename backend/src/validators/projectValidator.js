const Joi = require('joi');

const createProject = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(2000).allow(''),
  status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'archived').default('planning'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  startDate: Joi.date().iso(),
  deadline: Joi.date().iso(),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  members: Joi.array().items(
    Joi.object({
      user: Joi.string().hex().length(24).required(),
      role: Joi.string().valid('lead', 'member', 'viewer').default('member'),
    })
  ),
});

const updateProject = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(2000).allow(''),
  status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'archived'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  startDate: Joi.date().iso(),
  deadline: Joi.date().iso(),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  progress: Joi.number().min(0).max(100),
});

const addMember = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  role: Joi.string().valid('lead', 'member', 'viewer').default('member'),
});

module.exports = { createProject, updateProject, addMember };
