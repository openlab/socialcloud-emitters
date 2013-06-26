var twitter = require('ntwitter'),
  config = require('../config'),
  settingsRepo = require('../model/settings'),
  sub = require('../util/subscriptionListener'),
  socialMessage = require('../model/socialMessage');
var urlRegex = /(https?:\/\/[^\s]+)/g;

var twit = new twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
});

var theStream = null;
var theTrack = null;

var listener = null;

module.exports.stream = function(service) {
  settingsRepo.getByKeyWithDefault('twitterSearchTerm', 'Microsoft', function(obj) {
    theTrack = obj.value;
    twit.stream('statuses/filter', {
      track: theTrack
    }, function(stream) {
      theStream = stream;
      console.log("Starting up the Twitter Emitter", theTrack);
      stream.on('data', function(data) {
        //console.log(data);
        var rt = data.retweeted_status;
        if (rt) {
          data = data.retweeted_status;
        }
        handleData(data, service);
      });
    });
  });

  listener = new sub(config.configTopic, config.configSubName + '-twitter', function(msg) {
    console.log("[twitter] handling config change");
    settingsRepo.getByKey('twitterSearchTerm', function(err, obj) {
      var test = theTrack;
      if(Array.isArray(test)) {
        test = test.join(',');
      }
      if(test != obj.value) {
        console.log('we need to restart twitter searching to ', obj.value.split(','))
        theStream.destroy();
        theTrack = obj.value.split(',');
        twit.stream('statuses/filter', {
            track: theTrack
          }, function(stream) {
            theStream = stream;
            console.log("Starting up the Twitter Emitter", theTrack);
            stream.on('data', function(data) {
              //console.log(data);
              var rt = data.retweeted_status;
              if (rt) {
                data = data.retweeted_status;
              }
              handleData(data, service);
            });
          });
      }
    });
  }, true);

}

function handleData(data, service) {
  if (!data.text) {
    console.log('found a data with no text', data);
    return;
  }
  var msg = {
    id: data.id_str,
    type: "tweet",
    content: data.text.replace(urlRegex, ""),
    size: data.retweet_count + 1,
    colour: "red",
    //details: { 
    authorId: data.user.id,
    authorName: data.user.screen_name,
    authorProfileUrl: data.user.profile_image_url,
    dateTime: data.created_at
    //}
  };
  //console.log(msg);
  socialMessage.add(msg, function(err, obj) {
    if (err)
      console.log("Error saving to mongo", err);
    //else
    //  console.log("Tweet Saved");
  });
  sendMessage("twitter", service, msg);

  if (data.entities.media) {
    var img = data.entities.media[0];
    imgMsg = {
      id: img.id,
      type: "image",
      content: img.media_url,
      size: data.retweet_count,
      colour: "red",
      authorId: data.user.id,
      authorName: data.user.screen_name,
      authorProfileUrl: data.user.profile_image_url,
      dateTime: data.created_at
      //details: {}
    };

    socialMessage.add(imgMsg, function(err, obj) {
      if (err)
        console.log("Error saving to mongo", err);
      // else
      //   console.log("Image Saved");
    });

    sendMessage("image", service, imgMsg);
  }

}

function sendMessage(type, service, msg) {
  service.sendTopicMessage(config.messageTopic, {
    body: "Message From " + type,
    customProperties: msg
  }, function(error) {
    if (error) {
      //console.log("Failed to send to queue " + msg);
      //console.log("Error sending Message to topic:", error);
    }
  });
}