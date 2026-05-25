const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTask, updateTask, updateTaskOrder } = require('../validators/taskValidator');

router.use(protect);
router.route('/').get(taskController.getAll).post(validate(createTask), taskController.create);
router.put('/reorder', validate(updateTaskOrder), taskController.updateOrder);
router.get('/kanban/:projectId', taskController.getKanban);
router.route('/:id').get(taskController.getById).put(validate(updateTask), taskController.update).delete(taskController.delete);

// Subtask routes
router.post('/:id/subtasks', taskController.addSubtask);
router.put('/:id/subtasks/:subtaskId/toggle', taskController.toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', taskController.deleteSubtask);

module.exports = router;
