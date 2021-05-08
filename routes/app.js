const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const authController = require('../app/controllers/auth');

passport.use(new LocalStrategy({ usernameField: 'email' }, authController.localStrategy));

// auth
router.get('/auth/me', authController.me);
router.post('/auth/signup', multer().none(), authController.signUp);
router.post('/auth/signin', multer().none(), authController.signIn);

module.exports = router;