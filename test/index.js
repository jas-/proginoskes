/*!
 * proginoskes
 * Copyright(c) 2014-2018 Jason Gerfen <jason.gerfen@gmail.com>
 * License: MIT
 */

// Load our module
var cherubum = require('../')

// Init testing tools
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

// Set some paths for assets
var fs = require('fs');
var path = require('path');
var dir = path.dirname(fs.realpathSync(__filename)) + "/";
var assets = dir+ '/assets/';

// Define a timeout
var timeout = 1024 * 1024;


// Define options for proginoskes
var options = {
  global: {
    port: 2222,
    username: 'jas',
    password: 'password',
    logs: [
      assets+'test-1.log'
    ]
  },
  hosts: [
    {
      host: 'localhost',
      logs: [
        assets+'test-2.log'
      ]
    }
  ]
};

var server;

// Begin testing
describe('proginoskes', function() {

  beforeEach(function(done) {
    server = require(assets+'ssh-server.js');
    done();
  });

  afterEach(function(done) {
    done();
  });

  context('connection', function() {
    it('check for stream object', function(done) {

      this.timeout(timeout);

      cherubum.proginoskes(options, function(err, stream) {
        should.not.exist(err);
        stream.should.be.a('array');
        done();
      });
    });
  });
});
