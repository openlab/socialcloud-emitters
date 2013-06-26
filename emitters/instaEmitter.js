var Instagram = require('instagram-node-lib'),
    config = require('../config'),
    azure = require('azure'),
    settingsRepo = require('../model/settings'),
    socialMessage = require('../model/socialMessage');


Instagram.set('client_id', config.instagramKey ); //'');
Instagram.set('client_secret', config.instagramSecret ); //'');

var bus = null;
var lastId = 0;

module.exports = {
  start: function(serviceBus) {
    bus = serviceBus;
    grabImages();
  }
};


function grabImages() {

  settingsRepo.getByKeyWithDefault('instagramSearchTerm', 'Microsoft', function(obj) {
    console.log('Searching Instagram tags using the term %s', obj.value);
    var img = Instagram.tags.recent({
      name: obj.value,
      complete: sendImages,
      min_tag_id: lastId
    });
    setTimeout(grabImages, 5000);
  });
}

function sendImages(data, pagination) {
    if(pagination.min_tag_id ) {
      lastId = pagination.min_tag_id;
    } 
  for (var i = 0; i < data.length; i++) {
    var img = data[i];
    
    var msg = {
            id:img.id, 
            type:"image",
            content: img.images.standard_resolution.url,
            size: img.likes.count + 1, 
            colour:"red",
            //details: { 
              authorId: img.user.id,
              authorName: img.user.username,
              authorProfileUrl: img.user.profile_picture,
              dateTime: new Date(parseInt(img.created_time) * 1000)
            //}
          };

    socialMessage.add(msg, function(err, obj) {
          if(err)
            console.log(err);
        })
    bus.sendTopicMessage(config.messageTopic, 
      { body: "Message From Instagram", customProperties: msg }, function(error) {
          if (error) {
            console.log(error);
          }
        });
  };
}