const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');

const testUserController = require('../Controllers/testUserController');




router.route('/getUser')
    .get(testUserController.protect, authController.getUser);


router.route('/aggregateUsers')
    .get(testUserController.protect, testUserController.adminOnly, testUserController.aggregateUsers);


router.route('/createUser')
    .post(testUserController.protect, testUserController.adminOnly, testUserController.createUser);


router.route('/deleteUser')
    .delete(testUserController.protect, testUserController.adminOnly, testUserController.deleteUser);


router.route('/login')
    .post(testUserController.login);



module.exports = router;