var TABLE = 'AlertInst';

var mongoose = require('mongoose'),
	db = require('./baseRepo'),
	Schema = mongoose.Schema;

db.init();

module.exports = {
	_schema: new Schema({
		ruleId: String,
		ruleName:String,
		count: Number,
		dt: Date,
	}),
	getAll: function(callback) {
		var model = mongoose.model(TABLE, this._schema);
		model.find({}, callback);
	},
	
	increment: function(ruleId, callback) {
		var model = mongoose.model(TABLE, this._schema);
		var data = new model();

		model.update({
			ruleId: ruleId
		}, {
			$inc: {
				count: 1
			}
		}, {
			upsert: true
		}, callback);
	},
	addNew: function(ruleId, ruleName, count, dt, callback) {
		var model = mongoose.model(TABLE, this._schema);
		var dbModel = new model();

		dbModel.ruleId = ruleId;
		dbModel.ruleName = ruleName;
		dbModel.count = count;
		dbModel.dt = dt;

		console.log("about to save", dbModel);

		dbModel.save(callback);
	},

}