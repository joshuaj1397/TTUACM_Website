/* eslint-disable */
const chai = require('chai');
const path = require('path');
const request = require('supertest');
const app = require('../../app.js');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);
const db = require('../db-config');
const test = require('./user.mocks');

const expect = chai.expect;

mongoose.Promise = global.Promise;

// Bcrypt options\
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve('.env') });

// Node Endpoints
const loginURL = '/api/users/login';
const confirmURL = '/api/users/confirm';
const contactURL = '/api/users/contact-us';
const registerURL = '/api/users/register';
const forgotURL = '/api/users/forgot';
const resetURL = '/api/users/reset';
const profileURL = '/api/users/profile';
const updateResumeURL = '/api/users/update-resume';
const updateUserURL = '/api/users/update-user';

describe('User Router Suite', () => {
  before(async () => {
    await db.createTestConnection();
  });
  beforeEach(() => {
    expect(mockgoose.helper.isMocked()).to.be.true;
  });
  describe('Login Functionality', () => {
    beforeEach('Save a test user into the database', async () => {
      await db.reset();
      expect(mockgoose.helper.isMocked()).to.be.true;
    });
    it('Should reject a non-existing user', done => {
      db.saveTestUser().then(() => {
        request(app)
          .post(loginURL)
          .send(test.user002)
          .end((err, res) => {
            expect(res.status).to.equal(404);
            expect(res.body.msg).to.equal('User Not Found');
            done();
          });
      });
    });
    it('Should reject a non-verified user', done => {
      db.saveTestUser().then(() => {
        request(app)
          .post(loginURL)
          .send(test.user001)
          .end((err, res) => {
            expect(res.status).to.equal(404);
            expect(res.body.msg).to.equal('User Not Verified');
            done();
          });
      });
    });
    it('Should allow verified user to log in and pass a token', done => {
      db.saveVerifiedTestUser().then(user => {
        const post = {
          email: 'testUser3Email@gmail.com',
          password: 'testUser3Password'
        };
        request(app)
          .post(loginURL)
          .send(post)
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body.token).to.not.be.undefined;
            expect(res.body.token).to.not.be.null;
            done();
          });
      });
    });
  });
  describe('Registration Functionality', () => {
    beforeEach('Save a test user into the database', async () => {
      await db.reset();
      expect(mockgoose.helper.isMocked()).to.be.true;
    });
    it('Should allow a user to register', done => {
      request(app)
        .post(registerURL)
        .send(test.user001)
        .end((err, res) => {
          const payload = res.body.user;
          expect(res.status).to.equal(201);
          expect(err).to.be.null;
          expect(payload.email).to.not.be.undefined;
          expect(payload.classification).to.not.be.undefined;
          expect(payload.confirmEmailToken).to.not.be.undefined;
          expect(payload.password).to.not.be.undefined;
          done();
        });
    });
    it('Shoud reject a user that has the same email', done => {
      db.saveTestUser().then(() => {
        request(app)
          .post(registerURL)
          .send(test.user001)
          .end(async (err, res) => {
            const payload = res.body;
            expect(res.status).to.equal(401);
            expect(payload.emailAvailable).to.equal(false);
            done();
          });
      });
    });
    after(async () => {
      await db.reset();
    });
  });
  describe('Email confirmation Functionality', () => {
    before(async () => {
      await db.reset();
      process.env.CLIENT = '';
    });
    it('Should verify an email that has a confirmEmailToken in the database and redirect', done => {
      db.saveTestUser().then(user => {
        request(app)
          .get(`${confirmURL}/${user.confirmEmailToken}`)
          .end((err, res) => {
            expect(res.status).to.equal(302); // redirect code
            expect(res.header.location).to.equal('/auth/?verify=success');
            done();
          });
      });
    });
  });
  describe('Forgot/Reset Password Functionality', () => {
    let token;
    before(async () => {
      await db.reset();
      expect(mockgoose.helper.isMocked()).to.be.true;
      process.env.CLIENT = '';
    });
    it('Shoud send an email to the user about reseting their password and reset the password', done => {
      db.saveTestUser().then(user => {
        const email = user.email;
        request(app)
          .post(forgotURL)
          .send({ email })
          .end(async (err, res) => {
            const payload = res.body;
            expect(res.status).to.equal(200);
            expect(payload.recipient).to.not.be.null;
            expect(payload.msg).to.be.null;
            token = payload.recipient.resetPasswordToken;
            done();
          });
      });
    });
    it('Redirect the user to a page that prompts them for a new password', done => {
      request(app)
        .get(`${resetURL}/${token}`)
        .end((err, res) => {
          expect(res.status).to.equal(302);
          expect(res.header.location).to.equal(`/auth/forgot/redirect/?token=${token}`);
          done();
        });
    });
    it('Should replace the password with the given password', done => {
      request(app)
        .post(`${resetURL}/${token}`)
        .send({ password: 'A-New-Password' })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.user).to.not.be.null;
          expect(bcrypt.compareSync('A-New-Password', res.body.user.password)).to.be.true;
          done();
        });
    });
    after(async () => {
      await db.reset();
    });
  });
  describe('Contact Us Functionality', () => {
    it('Shoud send an email to ACM', done => {
      const post = {
        name: 'Curious User',
        email: 'redraider@ttu.edu',
        topic: 'Just Checking in',
        message: 'Hey everyone!!'
      };
      request(app)
        .post(contactURL)
        .send(post)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          done();
        });
    });
  });
  describe('Get User Profile Functionality', () => {
    let authToken;
    let email;
    before('Create and get their token', async () => {
      await db.reset();
      expect(mockgoose.helper.isMocked()).to.be.true;

      await db.saveVerifiedTestUser().then(user => {
        request(app)
          .post(loginURL)
          .send({ email: user.email, password: 'testUser3Password' })
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res.body.token).to.not.be.undefined;
            expect(res.body.token).to.not.be.null;

            authToken = res.body.token;
            email = res.body.user.email;
          });
      });
    });
    it('Should reject access without JWT', done => {
      request(app)
        .get(profileURL)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
    });
    it('Should reject access with invalid JWT', done => {
      request(app)
        .get(profileURL)
        .set('Authorization', 'jflkdjsfkljdslafjlkdsjflkd')
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
    });
    it('Should allow access with JWT and valid email', done => {
      request(app)
        .get(profileURL)
        .set('Authorization', authToken)
        .send({ email })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.user).to.not.be.null;
          done();
        });
    });
  });
  describe('Update User Resume Functionality', () => {
    let authToken;
    let id;
    before('Create and get their token', done => {
      db.reset()
        .then(() => {
          expect(mockgoose.helper.isMocked()).to.be.true;
          db.saveVerifiedTestUser()
            .then(user => {
              request(app)
                .post(loginURL)
                .send({ email: user.email, password: 'testUser3Password' })
                .end((err, res) => {
                  expect(err).to.be.null;
                  expect(res.body.token).to.not.be.undefined;
                  expect(res.body.token).to.not.be.null;
                  authToken = res.body.token;
                  id = res.body.user._id;
                  done();
                });
            })
            .catch(err => {
              console.log(err);
              process.exit(1);
            });
        })
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
    });
    it(`Should update the user's resume path given a JWT and a new path `, done => {
      const path = 'resume/path-to-resume.jpg';
      request(app)
        .put(updateResumeURL)
        .set('Authorization', authToken)
        .send({ id, path })
        .end((err, res) => {
          expect(res.body.err).to.be.null;
          expect(res.status).to.equal(200);
          expect(res.body.user).to.not.be.null;
          expect(res.body.user.resume).to.equal(path);
          done();
        });
    });
  });
  describe('Update User Functionality', () => {
    let authToken;
    let user;
    before('Create and get their token', done => {
      db.reset().then(() => {
        expect(mockgoose.helper.isMocked()).to.be.true;
          db.saveVerifiedTestUser().then(originalUser => {
            request(app)
              .post(loginURL)
              .send({ email: originalUser.email, password: 'testUser3Password' })
              .end((err, res) => {
                expect(err).to.be.null;
                expect(res.body.token).to.not.be.undefined;
                expect(res.body.token).to.not.be.null;
                authToken = res.body.token;
                user = res.body.user;
                done();
              });
            })
          .catch(err => {
            console.log(err);
            process.exit(1);
          });
        })
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
    });
    it(`Should update the user object given a JWT and new attributes `, done => {
      const firstName = 'A New First Name';
      const lastName = 'A New Last Name';
      user.firstName = firstName;
      user.lastName = lastName;
      request(app)
        .put(updateUserURL)
        .set('Authorization', authToken)
        .send({ user })
        .end((err, res) => {
          expect(res.body.err).to.be.null;
          expect(res.status).to.equal(200);
          expect(res.body.token).to.not.be.null;
          expect(res.body.user).to.not.be.null;
          expect(res.body.user.firstName).to.equal(firstName);
          expect(res.body.user.lastName).to.equal(lastName);
          done();
        });
    });
  });
});
