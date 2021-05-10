const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const authController = require('../app/controllers/auth');
const categoryController = require('../app/controllers/products/category');
const productController = require('../app/controllers/products/product');
const typeController = require('../app/controllers/products/type');

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
router.get('/product-categories/:id', categoryController.show);
router.post('/product-categories', multer().none(), categoryController.store);
router.put('/product-categories/:id', multer().none(), categoryController.update);
router.delete('/product-categories/:id', categoryController.destroy);

// type
router.get('/product-types', typeController.index);
router.get('/product-types/:id', typeController.show);
router.post('/product-types', multer().none(), typeController.store);
router.put('/product-types/:id', multer().none(), typeController.update);
router.delete('/product-types/:id', typeController.destroy);

module.exports = router;