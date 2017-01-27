var express = require('express');
var router = express.Router();
var TeamController = require('../controllers/v1/team');
var checkToken = require('../../api/middlewares/auth_token');
router.use(checkToken);


/* GET teams listing. */
router.param('id',TeamController.param);
router.route('/teams')
    .get(TeamController.find)
    .post(TeamController.create);

router.route('/teams/:id')
    .get(TeamController.findOne)
    .put(TeamController.update)
    .delete(TeamController.delete);

router.post('/teams/:id/followers',TeamController.follow);
router.post('/teams/:id/votes',TeamController.vote);
router.post('/teams/:id/comments',TeamController.comment);
router.post('/teams/:id/updates',TeamController.teamUpdate);



module.exports = router;