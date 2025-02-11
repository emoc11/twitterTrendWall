const Cron = require('node-cron');
var cronTask = Cron.schedule('*/5 * * * *', function(){
	// EVERY 15 MINS == */15 * * * *
	// console.log("--- CRON ---", new Date());
	getTrends();
});

const Twitter = require('twitter');
const Api = new Twitter({
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

const MongoClient = require('mongodb').MongoClient;
const Assert = require('assert');
const dbUrl = 'mongodb://localhost:27017';
const dbName = 'trendswall';

function doMongo(func) {
	console.log("--- DO MONGO ---");
	// Connect MongoDB
	MongoClient.connect(dbUrl, function(err, client) {
		if(err) {
			console.log("ERROR Mongo CONNECTION", err);
		}
		console.log("connected MongoDB OK");
		const db = client.db(dbName);

		func(db,function() {
			client.close();
		});
	});
}

function doTrends(trends) {
	console.log("--- DO TRENDS ---", new Date());

	// Mongo search for actif TRUE -> go false if not in trend
	doMongo(function(db,cb) {
		const collection = db.collection('trends');

		let allActif = collection.find({actif: true}).toArray(function(err, res) {
			if(err) {
				console.log("ERROR mongo FIND ACTIF", err);
			}

			for (var i = 0; i < res.length; i++) {
				let trend = res[i];

				// If dont find trend in current trending in twitter
				if(trends.find(o => o.name === trend.name) === undefined) {
					let name = trend.name
					let firstDate = trend.firstDate;
					let lastDate = trend.lastDate;
					let actif = false;
					let lastTimeActif = Date.now() - trend.lastDate.getTime();
					let tempsActif = trend.tempsActif + lastTimeActif;
					let nbActif = trend.nbActif;
					let maxActif = trend.maxActif >= lastTimeActif ? trend.maxActif : lastTimeActif;

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
		console.log(obj.name);

		// FIND trend in DB
		var foundTrend = {};
		doMongo(function(db,cb) {
			const collection = db.collection('trends');

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
			const collection = db.collection('trends');

			let name = obj.name
			let firstDate = new Date();
			let lastDate = new Date();
			let actif = true;
			let tempsActif = 0;
			let nbActif = 1;
			let maxActif = 0;

			if(foundTrend != undefined && foundTrend.constructor === Object && Object.keys(foundTrend).length !== 0) {
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