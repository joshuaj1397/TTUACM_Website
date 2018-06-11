const express = require('express');
const passport = require('passport');
const querystring = require('querystring');

// Controller
const UserCrtl = require('../controllers/user.controller');

const router = express.Router();

/**
 * Middleware for route guarding
 * If errors occur, it is probably because front-end is not sending
 * JWT along with their requests
 */
const membersOnlyRoute = passport.authenticate('jwt', { session: false });

// Routes pertaining to the user's account

/* POST Registion */
router.post('/register', UserCrtl.register);

/* POST Login */
router.post('/login', UserCrtl.login);

/* POST forgot page */
router.post('/forgot', UserCrtl.forgotLogin);

/* GET confirm page */
router.get('/confirm/:token', UserCrtl.confirmToken);

/* GET reset page (This is the route that the email hits) */
router.get('/reset/:token', (req, res) => {
  UserCrtl.resetToken(req)
    .then((token) => {
      const qs = querystring.stringify({ token });
      res.redirect(`${process.env.CLIENT}/auth/forgot/redirect/${qs}`);
    })
    .catch((err) => {
      const qs = querystring.stringify({ err });
      res.redirect(`${process.env.CLIENT}/auth/${qs}`);
      console.log(err.message);
    });
});

/* POST reset page (This is the route that Angular hits) */
router.post('/reset/:token', UserCrtl.reset);

/* GET User profile */
router.get('/profile', membersOnlyRoute, UserCrtl.getProfile);

// The Other routes

/* POST Contact Us */
router.post('/contact-us', UserCrtl.contactUs);

module.exports = router;
