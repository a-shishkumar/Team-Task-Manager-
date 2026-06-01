const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, checkPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProject, updateProject, addMember } = require('../validators/projectValidator');

router.use(protect);
router.route('/').get(checkPermission('view'), projectController.getAll).post(checkPermission('create'), validate(createProject), projectController.create);
router.route('/:id')
  .get(checkPermission('view'), projectController.getById)
  .put(checkPermission('edit'), validate(updateProject), projectController.update)
  .delete(checkPermission('delete'), projectController.delete);
router.put('/:id/archive', checkPermission('edit'), projectController.toggleArchive);
router.post('/:id/members', checkPermission('edit'), validate(addMember), projectController.addMember);
router.delete('/:id/members/:userId', checkPermission('edit'), projectController.removeMember);
router.get('/:id/stats', checkPermission('view'), projectController.getStats);

module.exports = router;
