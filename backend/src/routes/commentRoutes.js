const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', commentController.create);
router.get('/task/:taskId', commentController.getByTask);
router.route('/:id').put(commentController.update).delete(commentController.delete);

module.exports = router;
