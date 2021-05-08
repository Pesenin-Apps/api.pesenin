const multer = require('multer');
const router = require('express').Router();

const authController = require('../app/controllers/auth');

// auth
router.post('/auth/signup', multer().none(), authController.signUp);

module.exports = router;