const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProject, updateProject, addMember } = require('../validators/projectValidator');

router.use(protect);
router.route('/').get(projectController.getAll).post(validate(createProject), projectController.create);
router.route('/:id').get(projectController.getById).put(validate(updateProject), projectController.update).delete(projectController.delete);
router.put('/:id/archive', projectController.toggleArchive);
router.post('/:id/members', validate(addMember), projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);
router.get('/:id/stats', projectController.getStats);

module.exports = router;
