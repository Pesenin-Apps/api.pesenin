const os = require('os');
const multer = require('multer');
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { hasStaff, hasCustomer, hasGuest, hasRole } = require('../app/middlewares/authentication');

const guestController = require('../app/controllers/guest.controller');
const userController = require('../app/controllers/user.controller'); 
const productCategoryController = require('../app/controllers/products/category.controller');
const productController = require('../app/controllers/products/product.controller');
const productTypeController = require('../app/controllers/products/type.controller');
const tableController = require('../app/controllers/tables/table.controller');
const tableSectionController = require('../app/controllers/tables/section.controller');
const orderController = require('../app/controllers/order.controller');


const customerController = require('../app/controllers/customer.controller');
const authController = require('../app/controllers/auth.controller');
const staffController = require('../app/controllers/staff.controller');
const ordersController = require('../app/controllers/orders.controller');

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

router.get('/orders', hasStaff('cashier'), orderController.getOrders);

/* === START FOR WAITER === */
router.post('/waiters/change-status', hasRole('waiter'), userController.changeStatusWaiter);
// Order //
/* === END FOR WAITER === */

/* === START FOR CUSTOMER === */
router.get('/customers/orders', hasRole('customer'), orderController.getOrdersByCustomer);
// TODO: Create / Add Order Customer
router.post('/customers/orders', [ hasRole('customer'), multer().none() ], orderController.createOrderByCustomer);
// TODO: Update Order Customer
router.patch('/customers/orders/:id', [ hasRole('customer'), multer().none() ], orderController.updateOrderModifyByCustomer);
router.delete('/customers/orders/:id', [ hasRole('customer'), multer().none() ], orderController.updateOrderDeleteByCustomer);
// TODO: Cancel Order Customer
/* === END FOR CUSTOMER === */

/* ========= END ENDPOINT FOR USER ========= */


/* ========= START ENDPOINT USERS RESOURCES ========= */

router.get('/users', hasStaff('cashier'), userController.index);
router.get('/users/:id', hasStaff('cashier'), userController.show);
router.post('/users', [ hasStaff('cashier'), multer().none() ], userController.store);
router.patch('/users/:id', [ hasStaff('cashier'), multer().none() ], userController.update);
router.delete('/users/:id', hasStaff('cashier'), userController.destroy);

/* ========= END ENDPOINT USERS RESOURCES ========= */


/* ========= START ENDPOINT PRODUCTS RESOURCES ========= */

/* === START FOR PRODUCT TYPES === */
router.get('/products/types', productTypeController.index);
router.get('/products/types/:id', productTypeController.show);
router.post('/products/types', [ hasStaff('cashier'), multer().none() ], productTypeController.store);
router.patch('/products/types/:id', [ hasStaff('cashier'), multer().none() ], productTypeController.update);
router.delete('/products/types/:id', hasStaff('cashier'), productTypeController.destroy);
/* === END FOR PRODUCT TYPES === */

/* === START FOR PRODUCT CATEGORIES === */
router.get('/products/categories', productCategoryController.index);
router.get('/products/categories/:id', productCategoryController.show);
router.post('/products/categories', [ hasStaff('cashier'), multer().none() ], productCategoryController.store);
router.patch('/products/categories/:id', [ hasStaff('cashier'), multer().none() ], productCategoryController.update);
router.delete('/products/categories/:id', hasStaff('cashier'), productCategoryController.destroy);
/* === END FOR PRODUCT CATEGORIES === */

/* === START FOR PRODUCTS === */
router.get('/products', productController.index);
router.get('/products/:id', productController.show);
router.post('/products', [ hasStaff('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.store);
router.patch('/products/:id', [ hasStaff('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.update);
router.delete('/products/:id', hasStaff('cashier'), productController.destroy);
/* === END FOR PRODUCTS === */

/* ========= END ENDPOINT PRODUCTS RESOURCES ========= */


/* ========= START ENDPOINT TABLES RESOURCES ========= */

/* === START FOR TABLE SECTIONS === */
router.get('/tables/sections', tableSectionController.index);
router.get('/tables/sections/:id', tableSectionController.show);
router.post('/tables/sections', [ hasStaff('cashier'), multer().none() ], tableSectionController.store);
router.patch('/tables/sections/:id', [ hasStaff('cashier'), multer().none() ], tableSectionController.update);
router.delete('/tables/sections/:id', hasStaff('cashier'), tableSectionController.destroy);
/* === END FOR TABLE SECTIONS === */

/* === START FOR TABLES === */
router.get('/tables', tableController.index);
router.get('/tables/:id', tableController.show);
router.post('/tables', [ hasStaff('cashier'), multer().none() ], tableController.store);
router.patch('/tables/:id', [ hasStaff('cashier'), multer().none() ], tableController.update);
router.delete('/tables/:id', hasStaff('cashier'), tableController.destroy);
/* === END FOR TABLES === */

/* ========= END ENDPOINT TABLES RESOURCES ========= */










/* ========= START ENDPOINT FOR CUSTOMER ========= */

// authentication
router.post('/customers/check-in', multer().none(), customerController.checkIn);
router.post('/customers/check-out', hasCustomer(), customerController.checkOut);

// customer checked in info
router.get('/customers/me', hasCustomer(), customerController.me);

// order
router.get('/customers/orders', hasCustomer(), ordersController.getOrderForCustomer);
// router.post('/customers/orders', hasCustomer(), ordersController.createOrderForCustomer);
// router.post('/customers/orders/update', hasCustomer(), ordersController.updateOrderForCustomer);

/* ========= END ENDPOINT FOR CUSTOMER ========= */


/* ========= START ENDPOINT FOR STAFF (WAITER, KITCHEN, CASHIER) ========= */

// authentication
// router.post('/auth/signup', multer().none(), authController.signUp);
// router.post('/auth/signin', multer().none(), authController.signIn);
// router.post('/auth/signout', authController.signOut);

// staff signed in info
// router.get('/user/me', hasStaff('cashier','kitchen','waiter'),  staffController.me);
// router.post('/user/change-password', hasStaff('cashier','kitchen','waiter'), staffController.changePassword);
// router.post('/user/change-profile', hasStaff('cashier','kitchen','waiter'), staffController.changeProfile);
router.get('/orders/count', hasStaff('cashier','kitchen'), ordersController.getCountOrders);

/* ========= END ENDPOINT FOR STAFF (WAITER, KITCHEN, CASHIER) ========= */


/* ========= START ENDPOINT FOR WAITER ========= */

// profile
// router.post('/waiters/change-status', hasStaff('waiter'), staffController.changeStatus);

// order
router.post('/waiters/orders/verify/:id', hasStaff('waiter'), ordersController.verifyCustomerOrder);
router.post('/waiters/orders/check-out/:id', hasStaff('waiter'), ordersController.checkOutCustomerByWaiter);
router.get('/waiters/orders', hasStaff('waiter'), ordersController.getOrderForWaiter);
router.post('/waiters/orders', hasStaff('waiter'), ordersController.createOrderForWaiter);
router.patch('/waiters/orders/:id', hasStaff('waiter'), ordersController.updateOrderForWaiter);
router.delete('/waiters/orders/:id', hasStaff('waiter'), ordersController.destroyOrderItemForWaiter);

/* ========= END ENDPOINT FOR WAITER ========= */


// /* ========= START ENDPOINT USERS ========= */

// router.get('/users', hasStaff('cashier'), staffController.index);
// router.get('/users/:id', hasStaff('cashier'), staffController.show);
// router.post('/users', [ hasStaff('cashier'), multer().none() ], staffController.store);
// router.patch('/users/:id', [ hasStaff('cashier'), multer().none() ], staffController.update);
// router.delete('/users/:id', hasStaff('cashier'), staffController.destroy);

// /* ========= END ENDPOINT USERS ========= */


// /* ========= START PRODUCT ENDPOINT ========= */

// // type
// router.get('/products/types', productTypeController.index);
// router.get('/products/types/:id', productTypeController.show);
// router.post('/products/types', [ hasStaff('cashier'), multer().none() ], productTypeController.store);
// router.patch('/products/types/:id', [ hasStaff('cashier'), multer().none() ], productTypeController.update);
// router.delete('/products/types/:id', hasStaff('cashier'), productTypeController.destroy);

// // category
// router.get('/products/categories', productCategoryController.index);
// router.get('/products/categories/:id', productCategoryController.show);
// router.post('/products/categories', [ hasStaff('cashier'), multer().none() ], productCategoryController.store);
// router.patch('/products/categories/:id', [ hasStaff('cashier'), multer().none() ], productCategoryController.update);
// router.delete('/products/categories/:id', hasStaff('cashier'), productCategoryController.destroy);

// // product
// router.get('/products', productController.index);
// router.get('/products/:id', productController.show);
// router.post('/products', [ hasStaff('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.store);
// router.patch('/products/:id', [ hasStaff('cashier'), multer({dest: os.tmpdir()}).single('image') ], productController.update);
// router.delete('/products/:id', hasStaff('cashier'), productController.destroy);

// /* ========= END PRODUCT ENDPOINT ========= */


// /* ========= START TABLE ENDPOINT ========= */

// // section
// router.get('/tables/sections', tableSectionController.index);
// router.get('/tables/sections/:id', tableSectionController.show);
// router.post('/tables/sections', [ hasStaff('cashier'), multer().none() ], tableSectionController.store);
// router.patch('/tables/sections/:id', [ hasStaff('cashier'), multer().none() ], tableSectionController.update);
// router.delete('/tables/sections/:id', hasStaff('cashier'), tableSectionController.destroy);

// // table
// router.get('/tables', tableController.index);
// router.get('/tables/:id', tableController.show);
// router.post('/tables', [ hasStaff('cashier'), multer().none() ], tableController.store);
// router.patch('/tables/:id', [ hasStaff('cashier'), multer().none() ], tableController.update);
// router.delete('/tables/:id', hasStaff('cashier'), tableController.destroy);

// /* ========= END TABLE ENDPOINT ========= */

/* ========= START ORDER ITEM ENDPOINT ========= */

router.patch('/orders/items/:id', [ hasStaff('cashier', 'kitchen'), multer().none() ], ordersController.updateOrderItem);

/* ========= END ORDER ITEM ENDPOINT ========= */


/* ========= START ORDER ENDPOINT ========= */

router.get('/orders/:id', hasStaff('cashier','waiter','customer'), ordersController.getOrder);
router.patch('/orders/:id', hasStaff('cashier'), ordersController.updateOrder);

/* ========= END ORDER ENDPOINT ========= */


/* ========= START QUEUE ENDPOINT ========= */

router.get('/queues', hasStaff('cashier','kitchen'), ordersController.getQueues);

/* ========= END QUEUE ENDPOINT ========= */

module.exports = router;