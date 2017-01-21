var express = require('express');
var router = express.Router();
var PlayerController = require('../controllers/v1/player');
var config = require('config');

/* GET users listing. */
            router.param('id',PlayerController.param);
            router.route('/players')
            .get(PlayerController.find)
            .post(PlayerController.create);

            router.route('/players/:id')
            .get(PlayerController.findOne)
            .put(PlayerController.update)
            .delete(PlayerController.delete);
module.exports = router;