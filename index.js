
const Cron = require('node-cron');
var cronTask = Cron.schedule('30 * * * * *', function(){
	// EVERY 15 MINS == * */15 * * * *
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
	// console.log("--- DO MONGO ---");
	// Connect MongoDB
	MongoClient.connect(dbUrl, function(err, client) {
		Assert.equal(null, err);
		// console.log("connected MongoDB OK");
		const db = client.db(dbName);

		func(db,function() {
			client.close();
		});
	});
}

function doTrends(trends) {
	// console.log("--- DO TRENDS ---");

	// Mongo search for actif TRUE -> go false if not in trend
	// doMongo();

	trends.map(function(obj, index) {
		// console.log(obj.name);

		// FIND hashtag in DB
		var foundHash = {};
		doMongo(function(db,cb) {
			const collection = db.collection('hashtags');

			collection.findOne({name: obj.name}, function(err, res) {
				if(err) {
					console.log("ERROR mongo FINDONE", err);
				}

				foundHash = res;
				cb();
			});
		});

		// UPDATE hashtag in DB
		doMongo(function(db,cb) {
			const collection = db.collection('hashtags');

			let name = obj.name
			let firstDate = new Date();
			let lastDate = new Date();
			let actif = true;
			let totalActif = 1;
			let nbActif = 1;
			let maxActif = 0;

			if(Object.keys(foundHash).length !== 0 && foundHash.constructor === Object) {
				console.log(foundHash);
				firstDate = foundHash.firstDate;
				totalActif = foundHash.totalActif;
				nbActif = foundHash.nbActif + 1;
				maxActif = foundHash.maxActif;
			} else {
				console.log("NOT FOUND HASH <<<");
			}

			collection.updateOne(
				{name: name},
				{
					$set: {
						"name": name,
						"firstDate": firstDate,
						"lastDate": lastDate,
						"actif": actif,
						"totalActif": totalActif,
						"nbActif": nbActif,
						"maxActif": maxActif
					}
				},
				{upsert: true},
				function(err, res) {
					if(err) {
						console.log("ERROR mongo UPDATEONE", err);
						// return;
					}

					cb();
				}
			);
		});

	});
}

cronTask.start();