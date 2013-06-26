var config = require('../config'),
  subscriptionListener = require('../util/subscriptionListener'),
  ruleRepo = require('../model/alertRule'),
  alertRepo = require('../model/alertInst'),
  sub = require('../util/subscriptionListener'),
  rq = require('request'),
  SendGrid = require('sendgrid-nodejs'),
  twilio = require('twilio'),
  Pusher = require('pusher');

module.exports.rules = [];

module.exports.init = function() {
  console.log("Starting up the alert subscriber Emitter");
  ruleRepo.getAll(function(error, rules) {
    if( rules )
      console.log("will be looking for alerts for %s rules", rules.length);
    module.exports.rules = rules;
    new sub(config.messageTopic, config.alertSubName, handleMessage, true);
    new sub(config.configTopic, config.configSubName + '-alerts', handleConfigChange, true);
  });
}

function handleMessage(msg) {
  if (msg && msg.content && msg.content.length > 0) {
    for (index in module.exports.rules) {
      var rule = module.exports.rules[index];
      if (msg.content.toLowerCase().indexOf(rule.searchTerm.toLowerCase()) > -1) {
        if (!rule.count)
          rule.count = 1;
        else
          rule.count++;

        if (rule.count >= rule.threashold) {

          if (rule.sendText) sendTextAlert(rule);
          if (rule.sendEmail) sendEmailAlert(rule);
          if (rule.sendDashboard) sendDashboardAlert(rule);
          if (rule.sendMobile) sendMobileAlert(rule);

          alertRepo.addNew(rule._id, rule.ruleName, rule.count, new Date(), function(err, obj) {
            console.log('saved the instance');
          });

          rule.count = 0;
        }
      }
    }
  }
}

function handleConfigChange(msg) {
  console.log("[alertsub] handling config change", msg);
  if(msg.type == "update-rules") {
    ruleRepo.getAll(function(error, rules) {
        console.log("will be looking for alerts for %s rules", rules.length);
        var oldRules = module.exports.rules;

        for (var i = 0; i < rules.length; i++) {
          var r = rules[i];

          var or = oldRules.filter(function(element) {
            return r.ruleName === element.ruleName;
          });

          if(or) {
            rules[i].count = or.count;
          }
        };
        module.exports.rules = rules;

      }
    );
  }
}

function sendTextAlert(rule) {
  if(!rule.sms || rule.sms.length === 0) {
    console.log("[########################]Couldn't send sms message because the sms field is empty for " + rule.ruleName );
    return;
  }

  console.log("Sending Text alert for " + rule.searchTerm);

  var client = new twilio.RestClient(config.twillioSid, config.twillioToken);
  client.sms.messages.create({
    to: rule.sms,
    from:'+14256157239',
    body:'The alert you set up to alert you when the search term ' + rule.searchTerm + ' has been triggered.'
    }, function(err, msg) {
      if(err) { 
        console.log('SMS ERROR', err);
      }
      console.log('SMS Sent', msg);
    });
}

function sendEmailAlert(rule) {
  console.log("Sending Email alert for " + rule.searchTerm);
  var mail = new SendGrid.Email({
    to: rule.email,
    from: 'info@socialcloud.com',
    subject: 'Social Cloud Alert',
    html: '<h2>Social Cloud Alert</h2><p>The alert you set up to alert you when the search term <strong>' + rule.searchTerm + "</strong> has been triggered.</p>"
  });

  var sender = new SendGrid.SendGrid(config.sendgridUser, config.sendgridKey);

  
	sender.send(mail, function(success, err){
	    if(success) console.log('Email sent');
	    else console.log(err);
	});
}


function sendDashboardAlert(rule) {
  console.log("Sending Dashboard alert for " + rule.searchTerm);


  var pusher = new Pusher({
    appId: '46344',
    key: '195176193794b797d5a8',
    secret: 'fb295df820015c785f6c'
  });

  pusher.trigger('test_channel', 'my_event', {"msg": 'The alert you set up to alert you when the search term ' + rule.searchTerm + ' has been triggered.'});
}


function sendMobileAlert(rule) {
  console.log('sending mobile allert');
  rq('http://confoocloud.azure-mobile.net/api/testpush?msg=The alert you set up to alert you when the search term ' + rule.searchTerm + ' has been triggered.', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    }

    else {
      console.log('got and error and a response code of ' + response.statusCode, error );
    }
  })
  
}