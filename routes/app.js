const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { hasStaff, hasCustomer } = require('../app/middlewares/authentication');

const customerController = require('../app/controllers/customer.controller');
const authController = require('../app/controllers/auth.controller');
const staffController = require('../app/controllers/staff.controller');
const productCategoryController = require('../app/controllers/products/category.controller');
const productController = require('../app/controllers/products/product.controller');
const productTypeController = require('../app/controllers/products/type.controller');
const tableController = require('../app/controllers/tables/table.controller');
const tableSectionController = require('../app/controllers/tables/section.controller');
const orderController = require('../app/controllers/order.controller');

passport.use(new LocalStrategy({ usernameField: 'email' }, authController.localStrategy));

/* ========= START ENDPOINT FOR CUSTOMER ========= */

// authentication
router.post('/customers/check-in/:tableId', multer().none(), customerController.checkIn);
router.post('/customers/check-out', hasCustomer(), customerController.checkOut);

// customer checked in info
router.get('/customers/me', hasCustomer(), customerController.me);

// order
router.post('/customers/orders', hasCustomer(), orderController.createOrderForCustomer);
router.post('/customers/orders/update', hasCustomer(), orderController.updateOrderForCustomer);

/* ========= END ENDPOINT FOR CUSTOMER ========= */


/* ========= START ENDPOINT FOR STAFF (WAITER, KITCHEN, CASHIER) ========= */

// authentication
router.post('/auth/signup', multer().none(), authController.signUp);
router.post('/auth/signin', multer().none(), authController.signIn);
router.post('/auth/signout', authController.signOut);

// staff signed in info
router.get('/user/me', staffController.me);
router.get('/orders', orderController.getAllOrders);

/* ========= END ENDPOINT FOR STAFF (WAITER, KITCHEN, CASHIER) ========= */


/* ========= START ENDPOINT FOR WAITER ========= */

// profile
router.post('/waiters/change-status', hasStaff('waiter'), staffController.changeStatus);

// order
router.get('/waiters/orders', hasStaff('waiter'), orderController.getOrderForWaiter);
router.post('/waiters/orders', hasStaff('waiter'), orderController.createOrderForWaiter);
router.patch('/waiters/orders/:id', hasStaff('waiter'), orderController.updateOrderForWaiter);
router.post('/waiters/orders/verify/:id', hasStaff('waiter'), orderController.verifyCustomerOrder);

/* ========= END ENDPOINT FOR WAITER ========= */


/* ========= START ENDPOINT USERS ========= */

router.get('/users', hasStaff('cashier'), staffController.index);
router.get('/users/:id', hasStaff('cashier'), staffController.show);
router.post('/users', [ hasStaff('cashier'), multer().none() ], staffController.store);
router.patch('/users/:id', [ hasStaff('cashier'), multer().none() ], staffController.update);

/* ========= END ENDPOINT USERS ========= */


/* ========= START PRODUCT ENDPOINT ========= */

// type
router.get('/products/types', productTypeController.index);
router.get('/products/types/:id', productTypeController.show);
router.post('/products/types', [ hasStaff('cashier'), multer().none() ], productTypeController.store);
router.patch('/products/types/:id', [ hasStaff('cashier'), multer().none() ], productTypeController.update);
router.delete('/products/types/:id', hasStaff('cashier'), productTypeController.destroy);

// category
router.get('/products/categories', productCategoryController.index);
router.get('/products/categories/:id', productCategoryController.show);
router.post('/products/categories', [ hasStaff('cashier'), multer().none() ], productCategoryController.store);
router.patch('/products/categories/:id', [ hasStaff('cashier'), multer().none() ], productCategoryController.update);
router.delete('/products/categories/:id', hasStaff('cashier'), productCategoryController.destroy);

// product
router.get('/products', productController.index);
router.get('/products/:id', productController.show);
router.post('/products', [ hasStaff('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.store);
router.patch('/products/:id', [ hasStaff('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.update);
router.delete('/products/:id', hasStaff('cashier'), productController.destroy);

/* ========= END PRODUCT ENDPOINT ========= */


/* ========= START TABLE ENDPOINT ========= */

// section
router.get('/tables/sections', tableSectionController.index);
router.get('/tables/sections/:id', tableSectionController.show);
router.post('/tables/sections', [ hasStaff('cashier'), multer().none() ], tableSectionController.store);
router.patch('/tables/sections/:id', [ hasStaff('cashier'), multer().none() ], tableSectionController.update);
router.delete('/tables/sections/:id', hasStaff('cashier'), tableSectionController.destroy);

// table
router.get('/tables', tableController.index);
router.get('/tables/:id', tableController.show);
router.post('/tables', [ hasStaff('cashier'), multer().none() ], tableController.store);
router.patch('/tables/:id', [ hasStaff('cashier'), multer().none() ], tableController.update);
router.delete('/tables/:id', hasStaff('cashier'), tableController.destroy);

/* ========= END TABLE ENDPOINT ========= */

module.exports = router;