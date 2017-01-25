var express = require('express');
var router = express.Router();
var StateController = require('../controllers/v1/state');
var config = require('config');
var helper = require('../utils/helper');



/* GET states listing. */
router.param('id',StateController.param);
router.route('/states')
    .get(StateController.find)
    .post(StateController.create);

router.route('/states/:id')
    .get(StateController.findOne)
    .put(StateController.update)
    .delete(StateController.delete);

router.get('/states/:id/lgas',StateController.getLgasByState);
module.exports = router;