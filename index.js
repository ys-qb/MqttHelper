"use strict";
var mqtt = require('mqtt'),
  events = require('events'),
  util = require('util'),
  client = null;

/**
 * createClient - create an MQTT client
 *
 * @param {Number} [port] - broker port
 * @param {String} [host] - broker host
 * @param {Object} [opts] - keepalive, clientId, retryTimeout
 * @api public
 */
function MqttHelper(port, host, opts) {
  if (null == port || null == host) {
    throw new Error('port and host are required');
  }
  if (null == opts) {
    opts = {};
  }

  this.port = port;
  this.host = host;
  this.opts = opts;

  var self = this;

  (function init() {
    var client;

    self.client = client = mqtt.createClient(self.opts),

    client.on('connect', self.emit.bind(self, 'connect'));
    client.on('message', self.emit.bind(self, 'message'));

    client.on('error', function () {
      console.error('error');
      self.client = null;
      this.end();
    });
    client.on('close', function (err) {
      console.error('closed');
      self.client = null;
      this.end();
      setTimeout(init.bind(self), self.opts.retryTimeout || 60000);
      self.emit('close');
    });
  })();
}

util.inherits(MqttHelper, events.EventEmitter);

// same as MQTT.js client.publish
/**
 * publish - publish <message> to <topic>
 *
 * @param {String} topic - topic to publish to
 * @param {String, Buffer} message - message to publish
 * @param {Object} [opts] - publish options, includes:
 *    {Number} qos - qos level to publish on
 *    {Boolean} retain - whether or not to retain the message
 * @param {Function} [callback] - function(err){}
 *    called when publish succeeds or fails
 * @returns {MqttClient} this - for chaining
 * @api public
 *
 * @example client.publish('topic', 'message');
 * @example
 *     client.publish('topic', 'message', {qos: 1, retain: true});
 * @example client.publish('topic', 'message', console.log);
 */
MqttHelper.prototype.publish = function () {
  if (this.client) {
    this.client.publish.apply(this.client, arguments);
  } else {
    throw new Error('not connected');
  }
};

/**
 * subscribe - subscribe to <topic>
 *
 * @param {String, Array} topic - topic(s) to subscribe to
 * @param {Object} [opts] - subscription options, includes:
 *    {Number} qos - subscribe qos level
 * @param {Function} [callback] - function(err, granted){} where:
 *    {Error} err - subscription error (none at the moment!)
 *    {Array} granted - array of {topic: 't', qos: 0}
 * @returns {MqttClient} this - for chaining
 * @api public
 * @example client.subscribe('topic');
 * @example client.subscribe('topic', {qos: 1});
 * @example client.subscribe('topic', console.log);
 */
MqttHelper.prototype.subscribe = function () {
  if (this.client) {
    this.client.subscribe.apply(this.client, arguments);
  } else {
    throw new Error('not connected');
  }
};

module.exports = MqttHelper;

// EXAMPLE
/*
var mh = new MqttHelper(1883, 'localhost', {clientId: 'pi1', keepalive: 30});

setInterval(function () {
  mh.publish('pi1/temp1', Math.floor(Math.random() * 20).toString(), {qos: 1, retain: true}, function () { });
}, 5000);

mh.on('connect', function () {
  console.log('connected');
  this.subscribe('pi1/temp1', {qos: 1}, function (err, granted) {
    if (err) { console.error('subscribe error:', err); } 
  });
});

mh.on('message', function (topic, message, packet) {
  console.log(topic + ":" + message);
});

mh.on('close', function() {
  // this.unsubscribe()...
});
*/
