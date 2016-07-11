/*jslint node: true */
/*jslint indent: 2 */
'use strict';

var Soap = require('soap');
var SoapCookie = require('soap-cookie');
var parseString = require('xml2js').parseString;

var api_method, api_uri, api_userId, api_pass, api_ssl;
var api_wsdl_endpoint = "/Cher" + "wellService/?WSDL";
var loggedin = false;
var client = false;
var error = null;
var warning = null;
var keepalives = false;
var keepAliveMS = 1000 * 60 * 5;

module.exports = {};
var exports = module.exports;

function isNumber(num) {

  // simple test first
  if (!isNaN(num)) { return true; }

  // more tests if isNaN is false (i.e. is a number)
  // ensure parseInt doesnt drop characters
  if (parseInt(num, 10).toString() === num) { return true; }

  return false;
}

function keepalive() {

  // loggedin state required
  if (loggedin) {
    // reset timer
    setTimeout(keepalive, keepAliveMS);

    // send request
    exports.getSystemInfo(function () { return; });
  }
}

exports.connect = function (args, callback) {

  // sanity
  if (typeof callback !== 'function') { callback = function () { return; }; }

  // absent soap client required
  if (client) { return false; }

  // disconnected state required
  if (loggedin) { return false; }

  if (typeof args !== 'object') { return 'parameter must be an object'; }
  if (!args.host) { return 'object must contain host'; }
  if (!args.ssl) { args.ssl = true; }
  if (typeof args.ssl !== 'boolean') { return 'ssl must be true or false'; }
  if (!args.keepalives) { args.keepalives = false; }
  if (typeof args.keepalives !== 'boolean') { return 'keepalive must be true or false'; }

  api_ssl = args.ssl;
  switch (api_ssl) {
  case true:
    api_method = "https://";
    break;
  case false:
    api_method = "http://";
    break;
  }
  api_uri = api_method + args.host + api_wsdl_endpoint;
  keepalives = args.keepalives;

  Soap.createClient(api_uri, function (err, soapclient) {
    if (err) { error = "Soap.createClient error: " + err; return callback(error); }
    client = soapclient;
    if (args.userId && args.password) {
      exports.Login(args, function (err, result) {
        if (keepalives && !err) { setTimeout(keepalive, keepAliveMS); }
        return callback(err, result);
      });
    }
  });

  return true;
};

exports.connected = function () {
  if (!client) { return false; }
  if (!loggedin) { return false; }
  return true;
};

exports.error = function () {
  if (error) { return error; }
  return false;
};

exports.Login = function (args, callback) {

  // username required
  if (args.userId) {
    api_userId = args.userId;
  } else if (!api_userId) { error = 'object must contain userId key value'; return false; }

  // password required
  if (args.password) {
    api_pass = args.password;
  } else if (!api_pass) { error = 'object must contain password key value'; return false; }

  //console.log("userId:", api_userId);
  //console.log("password:", api_pass);

  // soap client and disconnected state required
  if (!client) { error = 'client has not been created'; return false; }
  if (loggedin) { error = 'not logged in'; return false; }

  var loginargs = { "userId": api_userId, "password": api_pass };
  client.Login(loginargs, function (err, result) {
    if (err) { error = "Soap Login error: " + err; return callback(err, result); }

    //console.log(client.lastResponseHeaders);
    // service sets ASP.NET_SessionId cookie
    // and expects to see it included with requests
    // until a logout call destroys it
    client.setSecurity(
      new SoapCookie(client.lastResponseHeaders)
    );

    loggedin = true;
    if (result !== null) { warning = "Login result: " + result; }
    return callback(err, result);
  });

  return true;
};

exports.GetBusinessObjectByPublicId = function (args, callback) {

  if (!loggedin) { return false; }
  if (typeof args === 'string') { args = { "busObPublicId": args }; }
  if (!args.busObNameOrId) { args.busObNameOrId = 'Incident'; }
  if (!args.busObPublicId) { return false; }

  client.GetBusinessObjectByPublicId(args, function (err, result) {
    if (result && result.GetBusinessObjectByPublicIdResult) {
      parseString(result.GetBusinessObjectByPublicIdResult, function (er, res) {
        // console.log(res);
        return callback(er, res);
      });
      return true;
    }
    
    return callback(err, result);
  });

  return true;
};

exports.Logout = function (callback) {

  if (!loggedin) { return false; }
  loggedin = false;

  client.Logout(null, callback);

  return true;
};

exports.Disconnect = function (callback) {
  exports.Logout(function (err, result) {
    client = false;
    return callback(err, result);
  });
};
