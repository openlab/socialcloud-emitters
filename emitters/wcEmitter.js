var config = require('../config'),
  settingsRepo = require('../model/settings'),
  sub = require('../util/subscriptionListener'),
  wordRepo = require('../model/word'),
  subscriptionListener = require('../util/subscriptionListener');

var serviceBusService = null;
var currentWords = [];
var blacklist = [];
var maxWords = config.maxWords;

module.exports.init = function(sbs) {
  console.log("Starting up the WC Emitter");

  settingsRepo.getByKey('maxWords', function(err, obj) {
    if (obj)
      maxWords = obj.value;

    settingsRepo.getByKey('blacklist', function(err, obj) {
      if (obj)
        blacklist = obj.value.split(',');

      new sub(config.messageTopic, config.wcSubName, handleMessage, true);
      new sub(config.configTopic, config.configSubName + '-wordcount', handleConfigChange, true);
    });

  });

  serviceBusService = sbs;
}

function handleMessage(cp) {
  if (cp.type === "tweet" && cp.size == 1 && cp.content.split) {
    var words = cp.content.split(' ');
    sendWords(words);
  }
}


function handleConfigChange(msg) {
  console.log("[wordcount] handling config change");
  if (msg.type === "update-blacklist") {
    settingsRepo.getByKey('blacklist', function(err, obj) {
      blacklist = obj.value.split(',');
      console.log("blacklist updated");
      console.log(blacklist);
    });
  } else if (msg.type === "update-config") {
    //first update wordcount.
    settingsRepo.getByKey('maxWords', function(err, obj) {
      console.log("Max Words updated to " + obj.value);
      maxWords = obj.value;
    })
  }
}

function sendWords(words) {
  //remove any duplicates
  words = words.filter(function(elem, pos) {
    return words.indexOf(elem) == pos;
  })
  for (var i = 0; i < words.length; i++) {
    var sent = false;
    if (words[i].length > 3 && blacklist.indexOf(words[i]) < 0) {
      var fnd = currentWords.filter(function(w) {
        if (w.word.toLowerCase() == words[i].toLowerCase() && !sent) {
          w.count++;
          sent = true;
          sendMessage(w.word, w.count);
          wordRepo.add(w.word, w.count, function(err, obj) {
            return true;
          });
        }
        return false;
      });
      if (fnd.length == 0) {
        currentWords.push({
          word: words[i],
          count: 1
        });
        if (maxWords > currentWords.length) {
          sendMessage(words[i], 1);
          wordRepo.add(words[i], 1, function(err, obj) {
            //added first instance of word
          });
        }
      }
    }
  };

}

function sendMessage(wrd, count) {
  var msg = {
    id: wrd,
    type: "word",
    content: wrd,
    size: count,
    colour: "red",
    details: {}
  };

  serviceBusService.sendTopicMessage(config.messageTopic, {
    body: "Message From WordCounter",
    customProperties: msg
  }, function(error) {
    if (error) 
      console.log(error);
  });
}