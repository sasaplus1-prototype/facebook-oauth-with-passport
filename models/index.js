'use strict';

const https = require('https');

module.exports = function({
  accessToken,
  isAuthenticated,
  userId,
}, callback) {
  if (isAuthenticated) {
    const req = https.request({
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v2.8/${userId}/feed?access_token=${accessToken}`,
      method: 'GET',
    }, function(res) {
      let buffer = '';

      res.on('data', function(data) {
        buffer += data;
      });
      res.on('end', function() {
        callback(null, {
          isLoggedIn: true,
          json: JSON.stringify(JSON.parse(buffer), null, 2),
        });
      });
    });
    req.on('error', function(err) {
      callback(err);
    });
    req.end();
  } else {
    callback(null, {
      isLoggedIn: false,
      json: '',
    });
  }
};
