const router = require('express').Router();
const { getMessages, createMessage } = require('../controllers/messageController');

router.get('/', getMessages);
router.post('/', createMessage);

module.exports = router;
