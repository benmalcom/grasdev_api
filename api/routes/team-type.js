var express = require('express');
var router = express.Router();
var TeamTypeController = require('../controllers/v1/team-type');
var config = require('config');

/* GET users listing. */
router.param('id',TeamTypeController.param);
router.route('/team-types')
    .get(TeamTypeController.find)
    .post(TeamTypeController.create);

router.route('/team-types/:id')
    .get(TeamTypeController.findOne)
    .put(TeamTypeController.update)
    .delete(TeamTypeController.delete);
module.exports = router;