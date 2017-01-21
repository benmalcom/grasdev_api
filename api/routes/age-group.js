var express = require('express');
var router = express.Router();
var AgeGroupController = require('../controllers/v1/age-group');
var config = require('config');

/* GET users listing. */
router.param('id',AgeGroupController.param);
router.route('/age-groups')
    .get(AgeGroupController.find)
    .post(AgeGroupController.create);

router.route('/age-groups/:id')
    .get(AgeGroupController.findOne)
    .put(AgeGroupController.update)
    .delete(AgeGroupController.delete);
module.exports = router;