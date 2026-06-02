const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTask, updateTask, updateTaskOrder } = require('../validators/taskValidator');
const { uploadAttachment } = require('../middleware/upload');

router.use(protect);
router.route('/').get(checkPermission('view'), taskController.getAll).post(checkPermission('create'), validate(createTask), taskController.create);
router.put('/reorder', checkPermission('edit'), validate(updateTaskOrder), taskController.updateOrder);
router.get('/kanban/:projectId', checkPermission('view'), taskController.getKanban);
router.route('/:id')
  .get(checkPermission('view'), taskController.getById)
  .put(checkPermission('edit'), validate(updateTask), taskController.update)
  .delete(checkPermission('delete'), taskController.delete);

// Subtask routes
router.post('/:id/subtasks', checkPermission('edit'), taskController.addSubtask);
router.put('/:id/subtasks/:subtaskId/toggle', checkPermission('edit'), taskController.toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', checkPermission('edit'), taskController.deleteSubtask);

// Attachment routes
router.post('/:id/attachments', checkPermission('edit'), uploadAttachment, taskController.addAttachment);
router.delete('/:id/attachments/:attachmentId', checkPermission('edit'), taskController.deleteAttachment);

module.exports = router;
