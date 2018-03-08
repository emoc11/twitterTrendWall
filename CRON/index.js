var Cron = require('node-cron');
var cronTask = Cron.schedule('*/5 * * * *', function(){
	// EVERY 15 MINS == */15 * * * *
	// console.log("--- CRON ---", new Date());
	getTrends();
});

var Twitter = require('twitter');
var Api = new Twitter({
  consumer_key: 'oDLjhgjzTY9U3kIQChA8MCH5P',
  consumer_secret: 'bKaLJJGjKhIKDfnozp1KZgFL9PtV0Kt9RB8LHiF95uItZpekbd',
  access_token_key: '326410325-mXzAnEgQ4rDBLpwfhHAYy1qdwsJ0YQhcBX8Zj4Q1',
  access_token_secret: 'dCw4Jb34ofwM0W4tIM8mSsV1KV2Yb4Xtx9T8qWanIwrci'
});

function getTrends() {
	Api.get("trends/place.json", {id: 23424819}, function(error, tweets, res) {
		if (error) {
			console.log("ERROR API TWITTER :", error);
			return;
		}

		// console.log("--- GET TRENDS ---");
		doTrends(tweets[0].trends);
	});
}

var MongoClient = require('mongodb').MongoClient;
var Assert = require('assert');
var dbUrl = 'mongodb://emoc11:pioupiou11@ds261138.mlab.com:61138';
var dbName = 'trendswall';

function doMongo(func) {
	// console.log("--- DO MONGO ---");
	// Connect MongoDB
	MongoClient.connect(dbUrl, function(err, client) {
		Assert.equal(null, err);
		// console.log("connected MongoDB OK");
		var db = client.db(dbName);

		func(db,function() {
			client.close();
		});
	});
}

function doTrends(trends) {
	console.log("--- DO TRENDS ---", new Date());

	// Mongo search for actif TRUE -> go false if not in trend
	doMongo(function(db,cb) {
		var collection = db.collection('trends');

		var allActif = collection.find({actif: true}).toArray(function(err, res) {
			if(err) {
				console.log("ERROR mongo FIND ACTIF", err);
			}

			for (var i = 0; i < res.length; i++) {
				var trend = res[i];

				// If dont find trend in current trending in twitter
				if(trends.find(o => o.name === trend.name) === undefined) {
					var name = trend.name
					var firstDate = trend.firstDate;
					var lastDate = trend.lastDate;
					var actif = false;
					var lastTimeActif = Date.now() - trend.lastDate.getTime();
					var tempsActif = trend.tempsActif + lastTimeActif;
					var nbActif = trend.nbActif;
					var maxActif = trend.maxActif >= lastTimeActif ? trend.maxActif : lastTimeActif;

					collection.updateOne(
						{name: name},
						{
							$set: {
								"name": name,
								"firstDate": firstDate,
								"lastDate": lastDate,
								"actif": actif,
								"tempsActif": tempsActif,
								"nbActif": nbActif,
								"maxActif": maxActif
							}
						},
						{upsert: false},
						function(err, res) {
							if(err) {
								console.log("ERROR mongo UPDATEONE -> not actif", err);
								// return;
							}
							cb();
						}
					);
				}
			}
		});
	});

	trends.map(function(obj, index) {
		// console.log(obj.name);

		// FIND trend in DB
		var foundTrend = {};
		doMongo(function(db,cb) {
			var collection = db.collection('trends');

			collection.findOne({name: obj.name}, function(err, res) {
				if(err) {
					console.log("ERROR mongo FINDONE", err);
				}

				foundTrend = res;
				cb();
			});
		});

		// UPDATE trend in DB
		doMongo(function(db,cb) {
			var collection = db.collection('trends');

			var name = obj.name
			var firstDate = new Date();
			var lastDate = new Date();
			var actif = true;
			var tempsActif = 0;
			var nbActif = 1;
			var maxActif = 0;

			if(foundTrend != undefined && foundTrend.varructor === Object && Object.keys(foundTrend).length !== 0) {
				firstDate = foundTrend.firstDate;
				tempsActif = foundTrend.tempsActif;
				nbActif = foundTrend.actif ? foundTrend.nbActif : foundTrend.nbActif + 1;
				maxActif = foundTrend.maxActif;
			}

			collection.updateOne(
				{name: name},
				{
					$set: {
						"name": name,
						"firstDate": firstDate,
						"lastDate": lastDate,
						"actif": actif,
						"tempsActif": tempsActif,
						"nbActif": nbActif,
						"maxActif": maxActif
					}
				},
				{upsert: true},
				function(err, res) {
					if(err) {
						console.log("ERROR mongo UPDATEONE -> new actif", err);
						// return;
					}

					cb();
				}
			);
		});

	});
}

cronTask.start();