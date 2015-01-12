/*!
 * proginoskes
 * Copyright(c) 2014-2015 Jason Gerfen <jason.gerfen@gmail.com>
 * License: MIT
 */

var cherubum = require('../')
  , fs = require('fs')
  , chai = require('chai')
  , should = chai.should()
  , expect = chai.expect;

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

describe('proginoskes', function(){

  describe('connection', function(){
    it('check for stream object', function(done){
      cherubum.proginoskes(options, function(err, stream){
        should.not.exist(err);
        stream.should.be.a('object');
      });
    });
  });
});
