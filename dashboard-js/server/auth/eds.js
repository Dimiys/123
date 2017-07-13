'use strict';

var express = require('express');
var router = express.Router();

var passport = require('passport');
const config = require('../config/environment');
router.use(passport.initialize());
passport.serializeUser(function (user, done) {
  console.log('serialize',user);
  done(null, user);
});


passport.deserializeUser(function (id, done) {
  console.log('deser', id);
  done(null, id)
});
passport.use(new (require('./passport_libs/passport-eds/index'))(config.eds,
  function (req, accessToken, refreshToken, profile, done) {
    let _this = this;
    let code;
    if(!profile)return done(null,null)
    if (!!profile.drfocode == true) {
      console.log('физик');
      code = profile.drfocode;
    } else if (profile.edrpoucode && profile.edrpoucode.length <= 10) {
      console.log('ФОП');
      code = profile.edrpoucode;
    } else {
      console.log('юрик');
      code = profile.edrpoucode;
    }

    for(let key in profile){
      profile[key] = profile[key].toString('utf8');
    }

    done(null,profile)
  }));
router.get('/', passport.authenticate('eds'));
router.get('/callback',
  passport.authenticate('eds', {failureRedirect: '/'}),
  function (req, res) {
    // Successful authentication, redirect home.
    console.log(req.user);
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send(req.user);
  });
module.exports = router;
