const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { hasRole } = require('../app/middlewares/authentication');

const authController = require('../app/controllers/auth');
const userController = require('../app/controllers/user');
const categoryController = require('../app/controllers/products/category');
const productController = require('../app/controllers/products/product');
const productTypeController = require('../app/controllers/products/type');

passport.use(new LocalStrategy({ usernameField: 'email' }, authController.localStrategy));

// auth
router.post('/auth/signup', multer().none(), authController.signUp);
router.post('/auth/signin', multer().none(), authController.signIn);
router.post('/auth/signout', authController.signOut);

// user
router.get('/user/me', userController.me);

/* ========= START PRODUCT ENDPOINT ========= */

// type
router.get('/products/types', productTypeController.index);
router.get('/products/types/:id', productTypeController.show);
router.post('/products/types', [ hasRole('cashier'), multer().none() ], productTypeController.store);
router.put('/products/types/:id', [ hasRole('cashier'), multer().none() ], productTypeController.update);
router.delete('/products/types/:id', hasRole('cashier'), productTypeController.destroy);

/* ========= END PRODUCT ENDPOINT ========= */

// product
router.get('/products', productController.index);
router.get('/products/:id', productController.show);
router.post('/products', [ hasRole('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.store);
router.put('/products/:id', [ hasRole('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.update);
router.delete('/products/:id', hasRole('cashier'), productController.destroy);

// category
router.get('/product-categories', categoryController.index);
router.get('/product-categories/:id', categoryController.show);
router.post('/product-categories', [ hasRole('cashier'), multer().none() ], categoryController.store);
router.put('/product-categories/:id', [ hasRole('cashier'), multer().none() ], categoryController.update);
router.delete('/product-categories/:id', categoryController.destroy);

module.exports = router;