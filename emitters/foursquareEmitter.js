var config = require('../config'),
	four = require('node-foursquare')(config.forsquareKeys),
    settingsRepo = require('../model/settings'),
    socialMessage = require('../model/socialMessage');

var bus = null;
var lastTime = 0;

module.exports = {
	start: function(serviceBus) {
		bus = serviceBus;
		getPhotos();
	}
};


function getPhotos() {
	settingsRepo.getByKeyWithDefault('foursquareVenueId', '4ad4c061f964a520adf720e3', function(obj) {
		console.log("we are searching forsquare based on the id: " + obj.value)
		four.Venues.getPhotos(obj.value, null, null, null, function(error, data) {
			if(error) {
				console.log(error);
			} else {
				var pics = data.photos.items.filter(function(p) {
					return(p.source.name != "Instagram" && p.createdAt > lastTime);
				}).sort(function(a, b) {
					return a.createdAt - b.createdAt;
				});

				for(var i = 0; i < pics.length; i++) {
					var p = pics[i];

					var msg = {
						id: p.id,
						type: "image",
						content: p.prefix + "width960" + p.suffix,
						size: 1,
						colour: "red",
						authorId: p.user.id,
						authorName: p.user.firstName + " " + p.user.lastName,
						authorProfileUrl: p.user.photo.prefix + "width960" + p.user.photo.suffix,
						dateTime: new Date(parseInt(p.createdAt) * 1000)

					};

					socialMessage.add(msg, function(err, obj) {
						if(err) console.log(err);
					})
					bus.sendTopicMessage(config.messageTopic, {
						body: "Message From Foursquare",
						customProperties: msg
					}, function(error) {
						if(error) {
							console.log(error);
						}
					});
				};

				if(pics.length > 0) {
					lastTime = pics[pics.length - 1].createdAt;
					console.log("last time set to " + new Date(parseInt(lastTime) * 1000))
				}
			}
		});
	});

	setTimeout(getPhotos, 10000);
}