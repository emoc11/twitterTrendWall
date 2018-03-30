var express = require('express');
var router = express.Router();
var app = require('../index.js');

router.get('/', function(req, res, next) {
	var mLabTrends = app.getAllTrends();
	console.log("ROUTER GET / in routes.js");
	res.sender('index', {tab_title: 'Twitter Topics Wall', title: 'Index TITLE', trends: mLabTrends});
});

router.get('/trend/:id', function(req, res, next) {
	res.sender('trend', {tab_title: 'Trending topics :'+req.id});
});

module.exports = router;