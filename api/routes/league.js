var express = require('express');
var router = express.Router();
var LeagueController = require('../controllers/v1/league');
var config = require('config');

/* GET users listing. */
router.param('id',LeagueController.param);
router.route('/leagues')
    .get(LeagueController.find)
    .post(LeagueController.create);

router.route('/leagues/:id')
    .get(LeagueController.findOne)
    .put(LeagueController.update)
    .delete(LeagueController.delete);
module.exports = router;