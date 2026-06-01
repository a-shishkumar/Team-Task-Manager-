const RolePermission = require('../models/RolePermission');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

exports.getPermissions = catchAsync(async (req, res) => {
  let permissions = await RolePermission.find({});

  // Seed default permissions if database is empty
  if (permissions.length === 0) {
    permissions = await RolePermission.create([
      { role: 'admin', create: true, view: true, edit: true, delete: true },
      { role: 'member', create: true, view: true, edit: true, delete: false },
    ]);
  }

  ApiResponse.success(res, permissions, 'Permissions retrieved successfully');
});

exports.updatePermissions = catchAsync(async (req, res) => {
  const updates = Array.isArray(req.body) ? req.body : [req.body];
  const results = [];

  for (const update of updates) {
    const { role, create, view, edit, delete: del } = update;
    const permission = await RolePermission.findOneAndUpdate(
      { role },
      { create, view, edit, delete: del },
      { new: true, upsert: true }
    );
    results.push(permission);
  }

  ApiResponse.success(res, results, 'Permissions updated successfully');
});
