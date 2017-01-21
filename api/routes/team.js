var express = require('express');
var router = express.Router();
var TeamController = require('../controllers/v1/team');


/* GET teams listing. */
router.param('id',TeamController.param);
router.route('/teams')
    .get(TeamController.find)
    .post(TeamController.create);

router.route('/teams/:id')
    .get(TeamController.findOne)
    .put(TeamController.update)
    .delete(TeamController.delete);
module.exports = router;