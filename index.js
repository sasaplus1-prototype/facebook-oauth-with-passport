'use strict';

const {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  CALLBACK_PATH,
} = process.env;

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !CALLBACK_PATH) {
  throw new Error('need FACEBOOK_APP_ID and FACEBOOK_APP_SECRET and CALLBACK_PATH');
}

//------------------------------------------------------------------------------

const util = require('util');

const passport = require('passport'),
      FacebookStrategy = require('passport-facebook').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `http://localhost:8000${CALLBACK_PATH}`,
  }, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
      done(null, Object.assign({}, profile, {
        accessToken,
        refreshToken,
      }));
    });
  })
);

//------------------------------------------------------------------------------

const express = require('express'),
      expressSession = require('express-session'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');
app.set('x-powered-by', false);

app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(expressSession({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

//------------------------------------------------------------------------------

app.get('/', function(req, res) {
  const index = require('./models/index');

  index({
    accessToken: (req.user || {}).accessToken,
    isAuthenticated: req.isAuthenticated(),
    userId: (req.user || {}).id,
  }, function(err, data) {
    if (err) {
      console.error(err);
      console.error(err.stack);

      return res.status(500).end();
    }

    res.render('index', Object.assign({}, data, { _with: false }));
  });
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/login',
  passport.authenticate('facebook', {
    scope: ['user_posts'],
  })
);

app.get(
  CALLBACK_PATH,
  passport.authenticate(
    'facebook', {
    failureRedirect: '/login'
  }), function(req, res) {
    res.redirect('/');
  }
);

app.listen(8000, function() {
  console.log('start server');
});
