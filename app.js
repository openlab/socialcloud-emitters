require('newrelic');

var azure = require('azure'),
	config = require('./config'),
	insta = require('./emitters/instaEmitter'),
	twitter = require('./emitters/twitterEmitter'),
	foursquare = require('./emitters/foursquareEmitter'),
    wc = require('./emitters/wcEmitter'),
    as = require('./subscriptions/alert-sub');

process.env.AZURE_SERVICEBUS_NAMESPACE= config.azureNamespace;
process.env.AZURE_SERVICEBUS_ACCESS_KEY= config.azureAccessKey;

var serviceBusService = azure.createServiceBusService();

serviceBusService.createTopicIfNotExists(config.messageTopic,function(error){
    if(!error){
        twitter.stream(serviceBusService, config.twitterTrack);
        insta.start(serviceBusService);
        foursquare.start(serviceBusService);
        wc.init(serviceBusService);
        as.init();
    }
});

