'use strict';

var express = require('express');
var url = require('url');
var config = require('../config/environment');
require('./activiti/basic');

var router = express.Router();

router.use('/activiti', require('./activiti'));
router.use('/eds', require('./eds'));

module.exports = router;
