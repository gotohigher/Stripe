'use strict';

var qs = require('qs');
var _ = require('lodash');

var hasOwn = {}.hasOwnProperty;
var toString = {}.toString;

var utils = module.exports = {

  isAuthKey: function (key) {
    return typeof key == 'string' && /^(?:[a-z]{2}_)?[A-z0-9]{32}$/.test(key);
  },

  isOptionsHash: function (o) {
    return toString.call(o) === '[object Object]' && (o.hasOwnProperty('api_key') || o.hasOwnProperty('idempotency_key'));
  },

  isObject: function(o) {
    return toString.call(o) === '[object Object]';
  },

  /**
   * Stringifies an Object, accommodating a single-level of nested objects
   * (forming the conventional key "parent[child]=value")
   */
  stringifyRequestData: function(data, _key) {

    if (data.expand) {
      data = _.cloneDeep(data);
      data['expand[]'] = data.expand;
      delete data.expand;
    }

    return qs.stringify(data, {indices: false});

  },

  /**
   * https://gist.github.com/padolsey/6008842
   * Outputs a new function with interpolated object property values.
   * Use like so:
   *   var fn = makeURLInterpolator('some/url/{param1}/{param2}');
   *   fn({ param1: 123, param2: 456 }); // => 'some/url/123/456'
   */
  makeURLInterpolator: (function() {
    var rc = {
      '\n': '\\n', '\"': '\\\"',
      '\u2028': '\\u2028', '\u2029': '\\u2029'
    };
    return function makeURLInterpolator(str) {
      return new Function(
        'o',
        'return "' + (
          str
          .replace(/["\n\r\u2028\u2029]/g, function($0) {
            return rc[$0];
          })
          .replace(/\{([\s\S]+?)\}/g, '" + encodeURIComponent(o["$1"]) + "')
        ) + '";'
      );
    };
  }()),

  /**
   * Return the data argument from a list of arguments
   */
  getDataFromArgs: function(args) {
    if (args.length > 0) {
      if (utils.isObject(args[0]) && !utils.isOptionsHash(args[0])) {
        return args.shift();
      }
    }
    return {};
  },

  /**
   * Return the options hash from a list of arguments
   */
  getOptionsFromArgs: function(args) {
    var opts = {
      auth: null,
      headers: {},
    }
    if (args.length > 0) {
      var arg = args[args.length - 1];
      if (utils.isAuthKey(arg)) {
        opts.auth = args.pop();
      } else if (utils.isOptionsHash(arg)) {
        var params = args.pop();
        if (params.api_key) {
          opts.auth = params.api_key;
        }
        if (params.idempotency_key) {
          opts.headers['Idempotency-Key'] = params.idempotency_key;
        }
      }
    } 
    return opts;
  },

  /**
   * Provide simple "Class" extension mechanism
   */
  protoExtend: function(sub) {
    var Super = this;
    var Constructor = hasOwn.call(sub, 'constructor') ? sub.constructor : function() {
      Super.apply(this, arguments);
    };
    Constructor.prototype = Object.create(Super.prototype);
    for (var i in sub) {
      if (hasOwn.call(sub, i)) {
        Constructor.prototype[i] = sub[i];
      }
    }
    for (i in Super) {
      if (hasOwn.call(Super, i)) {
        Constructor[i] = Super[i];
      }
    }
    return Constructor;
  }

};
