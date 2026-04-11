const session = require('express-session');
const passport = require('./config/passport');

app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_temporal',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 3600000 }
}));
app.use(passport.initialize());
app.use(passport.session());