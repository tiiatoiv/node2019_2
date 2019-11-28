'use strict';

const express = require('express');
const animal = require('./model/animal');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.urlencoded({extended: true}));

app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true }));

passport.use(new LocalStrategy(
    (username, password, done) => {
        console.log('login', username);
        //normally usermodel.findUser SELECT * from wop_user where username = ?, [username]
        //$2a$12$yxtfBXmWiB.EUTddHYiaaOS1kwAIqh7h5qDd8mwbJ346xcd1ZKTuW
        if(username !== 'test' || !bcrypt.compareSync(password, '$2a$12$yxtfBXmWiB.EUTddHYiaaOS1kwAIqh7h5qDd8mwbJ346xcd1ZKTuW')) {
            console.log('login', 'wrong username or password');
            return done(null, false);
        }
        return done(null, {username: username});
        /*User.findOne({ username: username }, function (err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (!user.verifyPassword(password)) { return done(null, false); }
          return done(null, user);
        });*/
    }
));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser((username, done) => {
    /*User.findById(id, function (err, user) {
          done(err, user);
        });*/
    done(null, {username: username});
});

app.use(passport.initialize());
app.use(passport.session());

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/');
    });

app.post('/register', (req, res) => {
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(req.body.password, salt);
    // insert into user (name, email, password) values (?, ?, ?), [req.body.name, req.body.email, hash]
    console.log('NEVER DO THAT', hash);
    res.send('account successfully created ☺');
});

if(process.env.SERVER === 'dev_localhost') {
    require('./secure/localhost')(app);
} else {
    require('./secure/server')(app);
    app.listen(3000, () => {
        console.log('server app start?');
    });
}


app.use(express.static('public'));

app.get('/animals', async (req, res) => {
    try {
        res.json(await animal.getAll());
    } catch (e) {
        console.log(e);
        res.send('db error :(');
    }
});

app.get('/animal', async (req, res) => {
    console.log(req.query);
    try {
        res.json(await animal.search(req.query.name));
    } catch(e) {
        res.send(`db error`);
    }
});

app.post('/animal',  async (req, res) => {
    console.log(req.body);
    try {
        res.json(await animal.insert(req.body.name));
    } catch (e) {
        console.log(e);
        res.send('db error');
    }
});

app.get('/', (req, res) => {
    if(req.secure) {
        console.log('is user in req', req.user);
        res.send('Hello secure');
    } else {
        res.send('Hello form my Node server unsecure');
    }
});

app.get('/demo', (req, res) => {
    console.log('request', req);
    res.send('demo');
});


