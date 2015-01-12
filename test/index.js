/*!
 * proginoskes
 * Copyright(c) 2014-2015 Jason Gerfen <jason.gerfen@gmail.com>
 * License: MIT
 */

var cherubum = require('../')
  , fs = require('fs')

var options = {
  global: {
    port: 22,
    username: 'root',
    password: 'password'
  },
  hosts: [
    {
      host: 'localhost',
      logs: [
        '/var/log/ufw.log',
        '/var/log/audit/audit.log'
      ]
    }
  ]
};

cherubum.proginoskes(options, function(err, stream){
  if (err) throw err;

  console.log(stream);
  console.log('===============================');
});
