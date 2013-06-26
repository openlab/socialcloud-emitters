var TABLE = 'Words';

var mongoose = require('mongoose'),
	db = require('./baseRepo'),
	Schema = mongoose.Schema;

db.init();

module.exports = {
	_schema: new Schema({
		word: String,
		count: Number
	}),
	getAll: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.find({}, callback);
	},
	
	add: function(word, count, callback) {
		var model = mongoose.model(TABLE, this._schema);
		var data = new model();

		model.update({
			word: word
		}, {
			$set: {
				count: count
			}
		}, {
			upsert: true
		}, callback);
	}

}