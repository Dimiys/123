/**
 * Module dependencies.
 */
var passport = require('passport-strategy')
  , util = require('util')
  , querystring  = require('querystring')
  , request = require('request');


function edsStrategy(options, verify) {
  passport.Strategy.call(this);
  this.name = 'eds';
  this.options = options;
  this.verify = verify;
}


util.inherits(edsStrategy, passport.Strategy);

edsStrategy.prototype.getAccessToken = function(authCode, callback) {

  var clientID     = this.options.clientID
    , clientSecret = this.options.clientSecret
    , callbackURL  = this.options.callbackURL;

  var eds = {
    code          : authCode,
    client_id     : clientID,
    client_secret : clientSecret,
    redirect_uri  : callbackURL,
    grant_type    : 'authorization_code'
  };

  var self = this;

  request.get({url:this.options.tokenURL, json:true, rejectUnauthorized:false, qs:eds}, function(err,response,body){
    self.options.userID = body.user_id;
    callback(err, body);
  });

};

edsStrategy.prototype.getCustomerInfo = function(accessToken, callback) {

  var eds = {
    access_token : accessToken,
    user_id      : this.options.userID,
    fields       : 'issuer,issuercn,serial,subject,subjectcn,locality,state,o,ou,title,surname,givenname,lastname,middlename,email,address,phone,dns,edrpoucode,drfocode'
  };

  request.get({url:this.options.customerURL, json:true, rejectUnauthorized:false, qs:eds}, function(err,httpResponse,customer){
    callback(err, customer);
  });
};


edsStrategy.prototype.authenticate = function(req,params) {
  var authCode     = req.query.code;

  var self = this;

  if(Object.keys(params).length == 0)
    return req.res.redirect(this.options.authorizationURL + '?' + querystring.stringify({
      client_id     :  this.options.clientID,
      redirect_uri  :  this.options.callbackURL,
      response_type : 'code'
    }));

  self.getAccessToken(authCode, function(err, Tokens) {

    var accessToken = Tokens.access_token;
    var refreshToken = Tokens.refresh_token;

    self.getCustomerInfo(accessToken, function(err,customer) {
      self.verify(req, accessToken, refreshToken, customer, function(err, user) {
        if (err) { return self.error(err); }
        self.success(user);
      });
    });
  });

};

module.exports = edsStrategy;
