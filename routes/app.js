const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { hasGuest, hasRole } = require('../app/middlewares/authentication');

const authController = require('../app/controllers/auth.controller');
const guestController = require('../app/controllers/guest.controller');
const userController = require('../app/controllers/user.controller'); 
const productCategoryController = require('../app/controllers/products/category.controller');
const productController = require('../app/controllers/products/product.controller');
const productTypeController = require('../app/controllers/products/type.controller');
const tableController = require('../app/controllers/tables/table.controller');
const tableSectionController = require('../app/controllers/tables/section.controller');
const orderController = require('../app/controllers/order.controller');

passport.use(new LocalStrategy({ usernameField: 'email' }, authController.localStrategy));


/* ========= START ENDPOINT FOR GUEST ========= */

router.get('/guest/me', hasGuest(), guestController.me);
router.post('/guest/check-in', multer().none(), guestController.checkIn);
router.post('/guest/check-out', hasGuest(), guestController.checkOut);
router.get('/guest/orders', hasGuest(), orderController.getOrderByGuest);
router.post('/guest/orders', [ hasGuest(), multer().none() ], orderController.createOrderByGuest);
router.patch('/guest/orders/:id', [ hasGuest(), multer().none() ], orderController.updateOrderModifyByGuest);
router.delete('/guest/orders/:id', hasGuest(), orderController.updateOrderDeleteByGuest);

/* ========= END ENDPOINT FOR GUEST ========= */


/* ========= START ENDPOINT FOR AUTHENTICATION ========= */

router.post('/auth/signup', multer().none(), authController.signUp);
router.post('/auth/signin', multer().none(), authController.signIn);
router.post('/auth/signout', hasRole('cashier','kitchen','waiter','customer'), authController.signOut);

/* ========= END ENDPOINT FOR AUTHENTICATION ========= */


/* ========= START ENDPOINT FOR USER ========= */

router.get('/users/me', hasRole('cashier','kitchen','waiter','customer'),  userController.me);
router.post('/users/change-profile', [ hasRole('cashier','kitchen','waiter','customer'), multer().none() ], userController.changeProfile);
router.post('/users/change-password', [ hasRole('cashier','kitchen','waiter','customer'), multer().none() ], userController.changePassword);

router.patch('/orders/items/:id', [ hasRole('cashier', 'kitchen', 'waiter'), multer().none() ], orderController.updateOrderItem);
router.get('/orders/count', hasRole('cashier','kitchen'), orderController.getOrderCounts);
router.get('/orders', hasRole('cashier'), orderController.getOrders);
router.get('/orders/:id', hasRole('cashier','waiter','customer'), orderController.getOrder);
router.patch('/orders/:id', hasRole('cashier'), orderController.updateOrder);
router.get('/queues', hasRole('cashier','kitchen'), orderController.getQueues);

/* === START FOR WAITER === */
router.post('/waiters/change-status', hasRole('waiter'), userController.changeStatusWaiter);
// Order //
router.get('/waiters/orders', hasRole('waiter'), orderController.getOrdersByWaiter);
router.post('/waiters/orders', hasRole('waiter'), orderController.createOrderByWaiter);
router.patch('/waiters/orders/:id', hasRole('waiter'), orderController.updateOrderModifyByWaiter);
router.post('/waiters/orders/verify/:id', hasRole('waiter'), orderController.verifyOrderByWaiter);
router.delete('/waiters/orders/:id', hasRole('waiter'), orderController.updateOrderDeleteByWaiter);
router.post('/waiters/orders/cancel/:id', hasRole('waiter'), orderController.cancelOrderByWaiter);
/* === END FOR WAITER === */

/* === START FOR CUSTOMER === */
router.get('/customers/orders', hasRole('customer'), orderController.getOrdersByCustomer);
router.post('/customers/orders', [ hasRole('customer'), multer().none() ], orderController.createOrderByCustomer);
router.patch('/customers/orders/:id', [ hasRole('customer'), multer().none() ], orderController.updateOrderModifyByCustomer);
router.delete('/customers/orders/:id', [ hasRole('customer'), multer().none() ], orderController.updateOrderDeleteByCustomer);
router.post('/customers/orders/cancel/:id', hasRole('customer'), orderController.cancelOrderByCustomer);
/* === END FOR CUSTOMER === */

/* ========= END ENDPOINT FOR USER ========= */


/* ========= START ENDPOINT USERS RESOURCES ========= */

router.get('/users', hasRole('cashier'), userController.index);
router.get('/users/:id', hasRole('cashier'), userController.show);
router.post('/users', [ hasRole('cashier'), multer().none() ], userController.store);
router.patch('/users/:id', [ hasRole('cashier'), multer().none() ], userController.update);
router.delete('/users/:id', hasRole('cashier'), userController.destroy);

/* ========= END ENDPOINT USERS RESOURCES ========= */


/* ========= START ENDPOINT PRODUCTS RESOURCES ========= */

/* === START FOR PRODUCT TYPES === */
router.get('/products/types', productTypeController.index);
router.get('/products/types/:id', productTypeController.show);
router.post('/products/types', [ hasRole('cashier'), multer().none() ], productTypeController.store);
router.patch('/products/types/:id', [ hasRole('cashier'), multer().none() ], productTypeController.update);
router.delete('/products/types/:id', hasRole('cashier'), productTypeController.destroy);
/* === END FOR PRODUCT TYPES === */

/* === START FOR PRODUCT CATEGORIES === */
router.get('/products/categories', productCategoryController.index);
router.get('/products/categories/:id', productCategoryController.show);
router.post('/products/categories', [ hasRole('cashier'), multer().none() ], productCategoryController.store);
router.patch('/products/categories/:id', [ hasRole('cashier'), multer().none() ], productCategoryController.update);
router.delete('/products/categories/:id', hasRole('cashier'), productCategoryController.destroy);
/* === END FOR PRODUCT CATEGORIES === */

/* === START FOR PRODUCTS === */
router.get('/products', productController.index);
router.get('/products/:id', productController.show);
router.post('/products', [ hasRole('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.store);
router.patch('/products/:id', [ hasRole('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.update);
router.delete('/products/:id', hasRole('cashier'), productController.destroy);
/* === END FOR PRODUCTS === */

/* ========= END ENDPOINT PRODUCTS RESOURCES ========= */


/* ========= START ENDPOINT TABLES RESOURCES ========= */

/* === START FOR TABLE SECTIONS === */
router.get('/tables/sections', tableSectionController.index);
router.get('/tables/sections/:id', tableSectionController.show);
router.post('/tables/sections', [ hasRole('cashier'), multer().none() ], tableSectionController.store);
router.patch('/tables/sections/:id', [ hasRole('cashier'), multer().none() ], tableSectionController.update);
router.delete('/tables/sections/:id', hasRole('cashier'), tableSectionController.destroy);
/* === END FOR TABLE SECTIONS === */

/* === START FOR TABLES === */
router.get('/tables', tableController.index);
router.get('/tables/:id', tableController.show);
router.post('/tables', [ hasRole('cashier'), multer().none() ], tableController.store);
router.patch('/tables/:id', [ hasRole('cashier'), multer().none() ], tableController.update);
router.delete('/tables/:id', hasRole('cashier'), tableController.destroy);
/* === END FOR TABLES === */

/* ========= END ENDPOINT TABLES RESOURCES ========= */

module.exports = router;