var EventFilter = require('matrix-eventfilter').EventFilter;
var applyFilter = require('matrix-eventfilter').apply;

// name can be array or string
function initSensor(name, options) {
  console.log('Initialize Sensor:'.blue, name);

  if (_.isUndefined(options)) {
    options = {};
  }

  var filter, sensorOptions;

  var sensors = [];
  // kick off sensor readers
  if (_.isArray(name)) {
    sensors.concat(name)
  } else {
    sensors.push(name);
  }

  var returnObj = function() {
    console.log(this, ' is a multi typed Matrix data object, please specify a child data souce using key-value notation ( obj.sensor or obj[\'sensor\'])')
    return {};
  };

  // handle many sensors
  _.forEach(sensors, function(s) {

    // break down options by key if necessary
    // { gyro: {}, face: {} .... }
    if (options.hasOwnProperty(s)) {
      sensorOptions = options.s;
    } else {
      sensorOptions = options;
    }

    // kick off sensor init
    process.send({
      type: 'sensor-init',
      name: s,
      options: sensorOptions
    });
  });

  // # matrix.init(sensor || CV)

  // prepare local chaining filter
  filter = new EventFilter(name);

  // then is a listener for messages from sensors
  // FIXME: Issue with app only storing one process at a time
  // console.log('sensor err >> looking into fix');
  var then = function(cb) {
    console.log('setup sensor listener')
    var result;
    // recieves from events/sensors
    process.on('message', function(m) {

      if (_.isUndefined(m)) {
        return console.log('[M]->[m] Empty Message From matrix.init'.red, name, options);
      }

      if (m.eventType === 'sensor-emit') {
        console.log('[M]->[m](%s):', name, m);
        // TODO: filter multiple sensors
        if (sensors.indexOf(m.sensor) > -1) {

          //TODO: when sensors fail to deliver, fail here gracefully
          m = _.omit(m, 'eventType');
          m.payload.type = m.sensor;

          // console.log('sensor:', m.sensor, '-> app'.blue, name, m);
          // if there is no filter, don't apply
          if (filter.filters.length > 0) {
            result = applyFilter(filter, m.payload);
          } else {
            result = m.payload;
          }

          if (result !== false && !_.isUndefined(result)) {
            // LORE: switched from err first to promise style
            // provides .then(function(data){})
            cb(result);
          }
        }
        // console.log('applying filter:', filter.json());
      }

    });
  }


  _.extend(filter, {
    then: then
  });

  if (_.isArray(name)) {

    //overload function with error message above throwing if no key specified
    returnObj[s] = filter;
  } else {
    // singles
    returnObj = filter;
  }


  return returnObj;
}

module.exports = initSensor;