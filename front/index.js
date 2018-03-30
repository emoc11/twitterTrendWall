// ---------------------------
// --------- REQUIRE ---------
// ---------------------------
var MongoClient = require('mongodb').MongoClient;
var Assert = require('assert');
var dbUrl = 'mongodb://emoc11:pioupiou11@ds261138.mlab.com:61138/trendswall';
var dbName = 'trendswall';

var fs = require('fs');
var path = require('path');
var express = require('express');
var hbs = require('express-handlebars');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();

// ---------------------------------
// --------- CONFIGURATION ---------
// ---------------------------------
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');

app.set('port', (process.env.PORT || 3000));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------
// --------- ROUTES ---------
// --------------------------
app.get('/', function(req, res, next) {
	console.log("ROUTER GET / in routes.js");
	getAllTrends(function(allTrends) {
		res.render('index', {tab_title: 'Twitter Topics Wall', title: 'Index TITLE', trends: allTrends});
	});
});

app.get('/trend/:id', function(req, res, next) {
	res.render('trend', {tab_title: 'Trending topics :'+req.id});
});

app.use(function(req, res, next) {
	var err = new Error('Not found');
	err.status = 404;
	next(err);
});

// Development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('404', {
      message: err.message,
      error: err
    });
  });
}

// Production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('404', {
    message: err.message,
    error: {}
  });
});

// --------------------------------
// --------- SERVEUR INIT ---------
// --------------------------------
app.listen(3000, function () {
  console.log('Server started on :3000 !')
});

// ------------------------------
// --------- MONGO CALL ---------
// ------------------------------
function doMongo(func) {
	// console.log("--- DO MONGO ---");
	// Connect MongoDB
	console.log("doMongo");
	MongoClient.connect(dbUrl, function(err, client) {
		console.log("doMongo -> connect", err);
		// Assert.equal(null, err);
		// console.log("connected MongoDB OK");
		var db = client.db(dbName);

		func(db,function() {
			client.close();
		});
	});
}

// ----------------------------------
// --------- GET ALL TRENDS ---------
// ----------------------------------
function getAllTrends(callBack) {
	var allTrends = {};
	console.log("getAllTrends");
	doMongo(function(db,cb) {
		var collection = db.collection('trends');

		console.log("getAllTrends -> doMongo");
		collection.find().toArray(function(err, res) {
			if(err) {
				console.log("ERROR mongo FINDONE", err);
			}

			allTrends = res;
			callBack(allTrends);
			cb();
		});
	});
}

module.exports = app;