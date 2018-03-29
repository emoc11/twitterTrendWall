var MongoClient = require('mongodb').MongoClient;
var Assert = require('assert');
var dbUrl = 'mongodb://emoc11:pioupiou11@ds261138.mlab.com:61138/trendswall';
var dbName = 'trendswall';

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

function getAllTrends() {
	var allTrends = {};
	console.log("getAllTrends");
	doMongo(function(db,cb) {
		var collection = db.collection('trends');

		console.log("getAllTrends -> doMongo");
		collection.find(function(err, res) {
			if(err) {
				console.log("ERROR mongo FINDONE", err);
			}

			// allTrends = res;
			console.log(res);
			cb();
		});
	});
}

getAllTrends();