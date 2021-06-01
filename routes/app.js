const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { hasRole, hasCustomer } = require('../app/middlewares/authentication');

const customerController = require('../app/controllers/customer');
const authController = require('../app/controllers/auth');
const userController = require('../app/controllers/user');
const productCategoryController = require('../app/controllers/products/category');
const productController = require('../app/controllers/products/product');
const productTypeController = require('../app/controllers/products/type');
const tableController = require('../app/controllers/tables/table');
const tableSectionController = require('../app/controllers/tables/section');
const orderController = require('../app/controllers/order');

// customer
router.post('/customers/check-in/:tableId', multer().none(), customerController.checkIn);
router.get('/customers/me', hasCustomer(), customerController.me);
router.post('/customers/check-out', hasCustomer(), customerController.checkOut);
router.post('/customers/orders', hasCustomer(), orderController.storeForCustomer);

/* ========= FOR WAITER ========= */

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
router.patch('/products/types/:id', [ hasRole('cashier'), multer().none() ], productTypeController.update);
router.delete('/products/types/:id', hasRole('cashier'), productTypeController.destroy);

// category
router.get('/products/categories', productCategoryController.index);
router.get('/products/categories/:id', productCategoryController.show);
router.post('/products/categories', [ hasRole('cashier'), multer().none() ], productCategoryController.store);
router.patch('/products/categories/:id', [ hasRole('cashier'), multer().none() ], productCategoryController.update);
router.delete('/products/categories/:id', productCategoryController.destroy);

// product
router.get('/products', productController.index);
router.get('/products/:id', productController.show);
router.post('/products', [ hasRole('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.store);
router.patch('/products/:id', [ hasRole('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.update);
router.delete('/products/:id', hasRole('cashier'), productController.destroy);

/* ========= END PRODUCT ENDPOINT ========= */

/* ========= START TABLE ENDPOINT ========= */

// section
router.get('/tables/sections', tableSectionController.index);
router.get('/tables/sections/:id', tableSectionController.show);
router.post('/tables/sections', [ hasRole('cashier'), multer().none() ], tableSectionController.store);
router.patch('/tables/sections/:id', [ hasRole('cashier'), multer().none() ], tableSectionController.update);
router.delete('/tables/sections/:id', hasRole('cashier'), tableSectionController.destroy);

// table
router.get('/tables', tableController.index);
router.get('/tables/:id', tableController.show);
router.post('/tables', [ hasRole('cashier'), multer().none() ], tableController.store);
router.patch('/tables/:id', [ hasRole('cashier'), multer().none() ], tableController.update);
router.delete('/tables/:id', hasRole('cashier'), tableController.destroy);

/* ========= END TABLE ENDPOINT ========= */

module.exports = router;