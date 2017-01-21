var express = require('express');
var router = express.Router();
var AssociationController = require('../controllers/v1/association');
var config = require('config');

/* GET users listing. */
router.param('id',AssociationController.param);
router.route('/associations')
    .get(AssociationController.find)
    .post(AssociationController.create);

router.route('/associations/:id')
    .get(AssociationController.findOne)
    .put(AssociationController.update)
    .delete(AssociationController.delete);
module.exports = router;