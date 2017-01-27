var express = require('express');
var router = express.Router();
var UserController = require('../controllers/v1/user');
var config = require('config');

var checkToken = require('../../api/middlewares/auth_token');
router.use(checkToken);

/* GET users listing. */
router.param('id',UserController.param);
router.get('/users/verify/mobile/:mobile',UserController.getUserByMobile);
router.route('/users')
    .get(UserController.find)
    .post(UserController.create);

router.route('/users/:id')
    .get(UserController.findOne)
    .put(UserController.update)
    .delete(UserController.delete);
module.exports = router;