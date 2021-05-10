const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const authController = require('../app/controllers/auth');
const categoryController = require('../app/controllers/category');
const productController = require('../app/controllers/product');

passport.use(new LocalStrategy({ usernameField: 'email' }, authController.localStrategy));

// auth
router.get('/auth/me', authController.me);
router.post('/auth/signup', multer().none(), authController.signUp);
router.post('/auth/signin', multer().none(), authController.signIn);
router.post('/auth/signout', authController.signOut);

// product
router.get('/products', productController.index);
router.post('/products', multer({dest: os.tmpdir()}).single('image'), productController.store);

// category
router.get('/products/category', categoryController.index);
router.get('/products/category/:id', categoryController.show);
router.post('/products/category', multer().none(), categoryController.store);
router.put('/products/category/:id', multer().none(), categoryController.update);
router.delete('/products/category/:id', categoryController.destroy);

module.exports = router;