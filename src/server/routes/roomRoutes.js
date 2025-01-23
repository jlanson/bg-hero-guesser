const express = require('express');
const { getRoomById, setupRoom } = require('../controllers/roomController');

const router = express.Router();

router.get('/setupRoom', setupRoom);
router.get('/:id', getRoomById);

module.exports = router;