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
router.get('/products/:id', productController.show);
router.post('/products', multer({dest: os.tmpdir()}).single('image'), productController.store);
router.put('/products/:id', multer({dest: os.tmpdir()}).single('image'), productController.update);
router.delete('/products/:id', productController.destroy);

// category
router.get('/product-categories', categoryController.index);
router.get('/products-categories/:id', categoryController.show);
router.post('/product-categories', multer().none(), categoryController.store);
router.put('/product-categories/:id', multer().none(), categoryController.update);
router.delete('/product-categories/:id', categoryController.destroy);

module.exports = router;