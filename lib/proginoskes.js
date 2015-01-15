/*!
 * proginoskes
 * Copyright(c) 2014-2015 Jason Gerfen <jason.gerfen@gmail.com>
 * License: MIT
 */

var version = 'v0.1.7'
  , fs = require('fs')
  , os = require('os')
  , ssh = require('ssh2')
  , async = require('async')
  , merge = require('deepmerge')
  , proginoskes = function(options, fn) {

  'use strict';

  /**
   * @object defaults
   * @abstract Default set of options
   *
   * @param Object} global - Global object for proginoskes
   * @param {Array} hosts - Array of configured streams
   */
  var defaults = {
    global: {
      threshold: os.cpus().length * 2,
      port: 22,
      logs: []
    },
    hosts: []
  };

  /**
   * @method config
   * @scope private
   * @abstract Configuration object
   */
  var config = config || {

    /**
     * @function init
     * @scope private
     * @abstract Creates new host object(s) from configuration
     *
     * @param {Object} obj Merged options
     *
     * @returns {Object}
     */
    init: function(obj) {
      var conf = [];

      if (obj.hasOwnProperty('hosts')) {
        if (obj.hosts.length >= 1) {
          obj.hosts.forEach(function(value) {
            var hosts = {};

            if (value.hasOwnProperty('debug') || obj.global.debug) {
              hosts.debug = console.log;
            }

            hosts.host = config.host(obj, value);

            hosts.port = config.port(obj, value);

            hosts.username = config.username(obj, value);

            if (value.hasOwnProperty('password')) {
              hosts.password = value.password;
            } else {
              if (obj.global.hasOwnProperty('password')) {
                hosts.password = obj.global.password;
              }
            }

            if (value.hasOwnProperty('privateKey')) {
              hosts.privateKey = config.privateKey(value.privateKey);
            } else {
              if (obj.global.hasOwnProperty('privateKey')) {
                hosts.privateKey = config.privateKey(obj.global.privateKey);
              }
            }

            if (!hosts.hasOwnProperty('password') &&
                !hosts.hasOwnProperty('privateKey')) {
              throw new Error(hosts.host+' is missing credentials');
            }

            if (value.hasOwnProperty('logs')) {
              if (!value.ignoreLogs) {
                hosts.logs = config.logs(obj.global, value.logs);
              } else {
                hosts.logs = value.logs;
              }
            } else {
              if (!value.ignoreLogs) {
                hosts.logs = obj.global.logs;
              }
            }

            conf.push(hosts);
          });
        }
      }

      return conf;
    },

    /**
     * @function host
     * @scope private
     * @abstract Setup host host name/ip
     *
     * @param {Object} obj Configuration object
     * @param {Object} value Object of host option(s)
     *
     * @returns {String}
     */
    host: function(obj, value) {
      return (!value.hasOwnProperty('host') ?
        (obj.global.hasOwnProperty('host') ? obj.global.host : '') :
        value.host);
    },

    /**
     * @function port
     * @scope private
     * @abstract Setup host port
     *
     * @param {Object} obj Configuration object
     * @param {Object} value Object of host option(s)
     *
     * @returns {Integer}
     */
    port: function(obj, value) {
      return (!value.hasOwnProperty('port') ?
        (obj.global.hasOwnProperty('port') ? obj.global.port : 22) :
        value.port);
    },

    /**
     * @function username
     * @scope private
     * @abstract Setup host username
     *
     * @param {Object} obj Configuration object
     * @param {Object} value Object of host option(s)
     *
     * @returns {String}
     */
    username: function(obj, value) {
      return (!value.hasOwnProperty('username') ?
        (obj.global.hasOwnProperty('username') ? obj.global.username : '') :
        value.username);
    },

    /**
     * @function privateKey
     * @scope private
     * @abstract Setup host privateKey
     *
     * @param {Object} obj Configuration object
     * @param {String} privateKey Defined privateKey
     *
     * @returns {Buffer}
     */
    privateKey: function(privateKey) {
      try {
        return fs.readFileSync(privateKey);
      } catch(err) {
        throw new Error('An error occured loading private key ('+err+')');
      }
    },

    /**
     * @function logs
     * @scope private
     * @abstract Setup host logs
     *
     * @param {Object} obj Configuration object
     * @param {Array} defined Defined logs array
     *
     * @returns {Array}
     */
    logs: function(obj, defined) {
      var logs = [];

      if (defined.length >= 1) {
        defined.forEach(function(log) {
          logs.push(log);
        });
      }

      if (obj.hasOwnProperty('logs')) {
        if (obj.logs.length >= 1) {
          obj.logs.forEach(function(log) {
            logs.push(log);
          });
        }
      }

      return logs;
    }
  }

  /**
   * @method libs
   * @scope private
   * @abstract Miscellaneous helper libraries
   */
  var libs = libs || {

    /**
     * @function merge
     * @scope private
     * @abstract Perform preliminary option/default object merge
     *
     * @param {Object} defaults Application defaults
     * @param {Object} obj User supplied object
     *
     * @returns {Object}
     */
    merge: function(defaults, obj) {
      defaults = defaults || {};
      return merge(defaults, obj);
    },

    /**
     * @function tail
     * @scope private
     * @abstract Create executable tail command for host(s)
     *
     * @param {Array} logs Array of log(s) to monitor
     *
     * return {Array}
     */
    tail: function(logs) {
      var ret = [];

      if (logs.length >= 1) {
        logs.forEach(function(log){
          ret.push('tail -f -n0 '+log);
        })
      }

      return ret;
    },

    /**
     * @function functions
     * @scope private
     * @abstract Create functions for handling host(s), popogates results
     *           to libs.stream()
     *
     * @param {Obect} host object with connection param(s)
     *
     * @returns {Array}
     */
    functions: function(hosts) {
      var funcs = [];

      if (hosts.length >= 1) {
        hosts.forEach(function(host) {
          host.funcs = funcs;
          var logs = libs.tail(host.logs);

          host.funcs.push(function fn(callback) {
            var conn = host.conn = new ssh()
              , fn = host.fn = callback;

            conn.on('error', function error(err) {

              callback({
                error: 'Could not connect to '+host.host,
                details: err
              });

            }).on('ready', function ready() {

              if (host.hasOwnProperty('debug')) {
                console.log(host.host+' was authenticated');
              }

              logs.forEach(function tail(log) {

                host.conn.exec(log, function cb(err, stream) {
                  if (err) callback(err);

                  libs.stream({
                    server: host.host,
                    log: log,
                    stream: stream
                  }, host.fn);

                });
              });

            }).connect(host);
          });
        });
      }

      return funcs;
    },

    /**
     * @function stream
     * @scope private
     * @abstract Handle return stream events
     *
     * @param {Object} stream SSH2 stream
     * @param {Function} fn Return function
     */
    stream: function(stream, fn) {
      stream.stream.on('exit', function(code, signal) {
        fn({
          error: stream.server+' has exited',
          details: code+' : '+signal
        });
      }).on('close', function() {
        fn({
          error: stream.server+' has closed'
        });
        /* setTimeout() for re-connection? */
      }).on('data', function(data) {
        var log = data.toString('utf8').split('\n');

        if (log.length > 0) {
          log.forEach(function(value){
            if (value && value.length > 0) {
              fn(null, {
                server: stream.server,
                log: stream.log.replace('tail \-f \-n0', '').trim(),
                data: value.trim()
              });
            }
          });
        }

      });
    }
  };

  /**
   * @function init
   * @scope public
   * @abstract Constructor
   *
   * @param {Object} options User supplied configuration object
   * @param {Function} fn User supplied function
   */
  var init = function(options, fn) {
    fn = fn || options;

    var opts = libs.merge(defaults, options)
      , funcs = [];

    opts.hosts = config.init(opts);

    if (opts.hasOwnProperty('hosts') && opts.hosts.length >= 1) {
      funcs = libs.merge(funcs, libs.functions(opts.hosts));
    } else {
      throw new Error('You must define at least one host to monitor');
    }

    async.parallelLimit(funcs, opts.global.threshold, function cb(err, data) {
      if (err) fn(err);

      fn(null, data);
    });

  }(options, fn);

};

exports.proginoskes = proginoskes;
