var TABLE = 'Settings';

var mongoose = require('mongoose'),
	db = require('./baseRepo'),
	Schema = mongoose.Schema;

db.init();

module.exports = {
	_schema: new Schema({
		key: String,
		value: String
	}),

	getByKey: function(key, callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.findOne({key: key}, callback);
	},

	getByKeyWithDefault: function(key,  defaultValue, callback ) {
		var model = mongoose.model(TABLE, this._schema);
		model.findOne({key: key}, function(err, obj) {
			if(obj)
				callback(obj);
			else
				module.exports.add(key, defaultValue, callback);
		});
	},

	getAll: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.find({}, callback);
	},
	
	add: function(key, value, callback) {
		var model = mongoose.model(TABLE, this._schema);
		var data = new model();
		console.log("upserting key: " + key + " with value: " + value );
		model.update({
			key: key
		}, {
			$set: {
				value: value
			}
		}, {
			upsert: true
		}, callback);
	}
}