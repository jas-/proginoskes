/*!
 * proginoskes
 * Copyright(c) 2014-2018 Jason Gerfen <jason.gerfen@gmail.com>
 * License: MIT
 */

var cherubum = require('../')

var server = require(process.cwd()+'/test/assets/ssh-server.js');

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var timeout = 1024 * 1024;


// Define options for proginoskes
var options = {
  global: {
    port: 2222,
    username: 'root',
    password: 'password',
    logs: [
      '/var/log/audit/audit.log'
    ]
  },
  hosts: [
    {
      host: 'localhost',
      logs: [
        '/var/log/ufw.log'
      ]
    }
  ]
};


var fs = require('fs');
var ssh2 = require('ssh2');
var crypto = require('crypto');
var exec = require('child_process');
var inspect = require('util').inspect;
var buffersEqual = require('buffer-equal-constant-time');

// Set some defaults
var assets = 'test/assets/';
var port = 2222;

// Ensure we have the tools to readh keys
var utils = ssh2.utils;
var pubKey = utils.genPublicKey(utils.parseKey(fs.readFileSync(assets+'id_rsa')));



describe('proginoskes', function() {

  beforeEach(function(done) {
    new ssh2.Server({hostKeys: [fs.readFileSync(assets+'host.key')]}, function(client) {

      client.on('authentication', function(ctx) {
        if (ctx.method === 'password'
            && ctx.username === 'root'
            && ctx.password === 'password') 
          ctx.accept();
        else if (ctx.method === 'publickey'
                && ctx.key.algo === pubKey.fulltype
                 && buffersEqual(ctx.key.data, pubKey.public)) {
          if (ctx.signature) {
            var verifier = crypto.createVerify(ctx.sigAlgo);
            verifier.update(ctx.blob);
            if (verifier.verify(pubKey.publicOrig, ctx.signature))
              ctx.accept();
            else
              ctx.reject();
          } else {
            ctx.accept();
          }
        } else
          ctx.reject();
      }).on('ready', function() {
        client.on('session', function(accept, reject) {
          var session = accept();
          session.once('exec', function(accept, reject, info) {

            var stream = accept();

            require('child_process').execSync(info.command, function(err, stdout, stderr) {
              if (err) return stream.write(new Error(err));

              stream.write(stdout);
              stream.exit(0);
              stream.end();
            });
          });
        });
      }).on('end', function() {

      });
    }).listen(port, '127.0.0.1', function() {
      // listening for connections
    });
    done();
  });

  afterEach(function(done) {
    
  });

  context('connection', function() {
    it('check for stream object', function(done) {
      this.timeout(timeout);
      cherubum.proginoskes(options, function(err, stream) {
        console.log(arguments)
        //should.not.exist(err);

        //stream.should.be.a('object');
        done();
      });
    });
  });
});
