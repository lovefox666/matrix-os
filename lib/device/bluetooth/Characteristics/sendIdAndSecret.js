var util = require('util');
var debug = debugLog('bt-char-send');
var uuid = '2A21';

var SendIdAndSecretCharacteristic = function () {
  SendIdAndSecretCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write', 'notify']
  });
};

util.inherits(SendIdAndSecretCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

function authenticateDevice(options) {
  var err;
  if (_.isUndefined(options) || options === '') {
    err = new Error('Empty BLE payload sent');
  } else if (!_.isUndefined(Matrix.deviceId)) {
    err = new Error('Device is already configured with id ' + Matrix.deviceId);
  } else {
    try {
      options = JSON.parse(options);
    } catch (error) {
      err = new Error('Unable to parse content ' + options);
    }

    if (!err && (!_.has(options, 'id') || !_.has(options, 'secret') || !_.has(options, 'env'))) {
      err = new Error('Parameter missing ' + JSON.stringify(options));
    } else if (Matrix.env !== options.env) {  
      err = new Error('Environment missmatch ' + options.env);
    }
  }
  if(err) debug('Error sending ID and Secret: ' + err.message);
  return Matrix.device.bluetooth.emitter.emit('deviceAuth', err, uuid, options);
}

var sendIdAndSecretCharacteristic = new SendIdAndSecretCharacteristic();
sendIdAndSecretCharacteristic.on('newData', authenticateDevice.bind(sendIdAndSecretCharacteristic));
module.exports = sendIdAndSecretCharacteristic;