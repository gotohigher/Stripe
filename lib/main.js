/* Copyright 2011 Ask Bjørn Hansen, see LICENSE */
"use strict";

var https = require('https');
var querystring = require('querystring');

function setup_response_handler(req, callback) {
    if (typeof callback !== "function") {
        //console.log("missing callback");
        return;
    }
    req.on('response',
        function(res) {
            var response = '';
            res.setEncoding('utf8');
            res.on('data',
                function(chunk) {
                    response += chunk;
            });
            res.on('end',
                function() {
                    var err = 200 == res.statusCode ? 0 : res.statusCode;
                    try {
                        response = JSON.parse(response);
                        callback(null, response);
                    }
                    catch(e) {
                        console.log(response);
                        callback(err, {});
                    }
            });
        });
}

module.exports = function (api_key, options) {
    var defaults = options || {};

    var auth = 'Basic ' + new Buffer(api_key + ":").toString('base64');

    function _request(method, path, data, callback) {

        //console.log("data", typeof data, data);

        // convert first level of deep data structures to foo[bar]=baz syntax
        Object.keys(data).forEach(function(key) {
            if (typeof data[key] === 'object' && data[key] !== null) {
                var o = data[key];
                delete data[key];
                Object.keys(o).forEach(function(k) {
                    var new_key = key + "[" + k + "]";
                    data[new_key] = o[k];
                });
            }
        });

        var request_data = querystring.stringify(data);

        //console.log(method, "request for", path);
        //console.log("http request", request_data);

        var request_options = {
              host: 'api.stripe.com',
              port: '443',
              path: path,
              method: method,
              headers: {
                  'Authorization': auth,
                  'Accept': 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': request_data.length
              }
          };

        var req = https.request(request_options);
        setup_response_handler(req, callback);
        req.write(request_data);
        req.end();
    }

    function post(path, data, callback) {
        _request('POST', path, data, callback);
    }

    function get(path, data, callback) {
        _request('GET', path, data, callback);
    }

    function del(path, data, callback) {
        _request('DELETE', path, data, callback);
    }

    return {
        charges: {
            create: function (data, cb) {
                post("/v1/charges", data, cb);
            },
            retrieve: function(charge_id, cb) {
                if(!(charge_id && typeof charge_id === 'string')) {
                    cb("charge_id required");
                }
                get("/v1/charges/" + charge_id, {}, cb);
            },
            refund: function(charge_id, amount, cb) {
                if(!(charge_id && typeof charge_id === 'string')) {
                    cb("charge_id required");
                }
                post("/v1/charges/" + charge_id + "/refund", { amount: amount }, cb);
            },
            list: function(data, cb) {
                get("/v1/charges", data, cb);
            },
        },
        customers: {
            create: function (data, cb) {
                post("/v1/customers", data, cb);
            },
            retrieve: function(customer_id, cb) {
                if (!(customer_id && typeof customer_id === 'string')) {
                    cb("customer_id required");
                }
                get("/v1/customers/" + customer_id, {}, cb);
            },
            update: function(customer_id, data, cb) {
                post("/v1/customers/" + customer_id, data, cb);
            },
            del: function(customer_id, cb) {
                del("/v1/customers/" + customer_id, {}, cb);
            },
            list: function(count, offset, cb) {
                get("/v1/customers", { count: count, offset: offset}, cb );
            }
        },
        token: {
            create: function (data, cb) {
                post("/v1/tokens", data, cb)
            },
            retrieve: function (token_id, cb) {
                get("/v1/tokens/" + token_id, cb)
            }
        },
    };
}
