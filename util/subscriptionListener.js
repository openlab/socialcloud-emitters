var azure = require('azure'),
	config = require('../config');


process.env.AZURE_SERVICEBUS_NAMESPACE = config.azureNamespace;
process.env.AZURE_SERVICEBUS_ACCESS_KEY = config.azureAccessKey;

function subListener(topic, sub, callback, start) {
	this._serviceBusService = azure.createServiceBusService();
	this._topicName = topic;
	this._subName = sub;
	this._callback = callback;


	var self = this;
	//This is a hack, but there is no such thing as create if not exists on subscriptions
	this._serviceBusService.createSubscription(self._topicName, self._subName, function(err){
		if(err) console.log(err.detail);
		if (start) {
			self.getMessage();
		}
	});

	
	
}

subListener.prototype.getMessage = function() {
	var self = this;
	this._serviceBusService.receiveSubscriptionMessage(
		this._topicName,
		this._subName, 
		function(error, receivedMessage) {
			if (!error) {
				self._callback(receivedMessage.customProperties);
			} else {
				if( error != "No messages to receive" )
					console.log("there was an error:", error);
			}

			self.getMessage();
		}
	);
}

module.exports = subListener;