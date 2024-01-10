import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../../../db/models';
import { createSession, verifyRefreshToken } from '../../../utils/jwt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

const router = express.Router();

/*
  @route POST /user/auth/login
  @desc Login user
  @access Public

  @param {string} email
  @param {string} password

  @return {object} user
*/
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) return res.status(409).send({message: 'No account found with this email'});

      bcrypt
        .compare(password, user.password)
        .then(async (match) => {
          if (!match) return res.status(403).send({message: 'Wrong password'});

          if (!user.verified) {
            const token = crypto.randomBytes(32).toString('hex');
            const tokenExp = Date.now() + 1000 * 60 * 30;

            user.verifyToken = token;
            user.verifyTokenExp = tokenExp as any;

            return user.save().then(async () => {
              return await verifyEmail(token, email, user.username).then(() => {
                return res.send({message: 'Email sent'});
              }).catch((err) => {
                console.log(err);
                return res.status(500).send({message: 'Internal Server Error'});
              });
            }).catch((err) => {
              console.log(err);
              return res.status(500).send({message: 'Internal Server Error'});
            });
          }

          let tokens: any = await createSession(user._id);

          res.send({
            user: { _id: user._id, username: user.username },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send({message: 'Internal Server Error'});
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({message: 'Internal Server Error'});
    });
});

/*
  @route POST /user/auth/register
  @desc Register user
  @access Public

  @param {string} username
  @param {string} email
  @param {string} password

  @return {object} user
*/
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if(username.length < 4) return res.status(400).send({message: 'Username must be at least 4 characters long'});

  if(!isEmail(email)) return res.status(400).send({message: 'Invalid email address'});

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExp = Date.now() + 1000 * 60 * 30;

  // check if someone has a the same username including capital letters
  let foundUser = await User.findOne({ username: { $regex: new RegExp(username, 'i') } });
  if(foundUser) return res.status(409).send({message: 'This username is already registered'});

  // check if someone has a the same email including capital letters
  let foundUserEmail = await User.findOne({ email: { $regex: new RegExp(email, 'i') } });
  if(foundUserEmail) return res.status(409).send({message: 'This email is already registered'});

  const newUser = new User({
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    verifyToken: token,
    verifyTokenExp: tokenExp,
  });

  newUser
    .save()
    .then(async (user) => {
      verifyEmail(token, email, username).then((message) => {
        res.send({message});
      }).catch((err) => {
        console.log(err);
        res.status(500).send({message: 'Internal Server Error'});
      });
    })
    .catch((err) => {
      if (err.code === 11000)
        if(err.keyPattern.username) return res.status(409).send({message: 'This username is already registered'});
        if(err.keyPattern.email) return res.status(409).send({message: 'This email is already registered'});
      console.log(err);
      res.status(500).send({message: 'Internal Server Error'});
    });
});

/*
  @route POST /user/auth/verify/:token
  @desc Verify user
  @access Public

  @param {string} token

  @return {object} user
*/
router.post('/verify/:token', (req, res) => {
  const { token } = req.params;

  User.findOne({ verifyToken: token })
    .then((user) => {
      if (!user) return res.status(404).send({message: 'User not found'});

      if (user.verifyTokenExp < new Date()) {
        user.verifyToken = undefined;
        user.verifyTokenExp = undefined;

        user.save().catch((err) => {
          console.log(err);
          return res.status(500).send({message: 'Internal Server Error'});
        });
        return res.status(400).send({message: 'Token expired'});
      }

      user.verified = true;
      user.verifyToken = undefined;
      user.verifyTokenExp = undefined;

      user
        .save()
        .then(() => {
          res.send({message: 'Account verified'});
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send({message: 'Internal Server Error'});
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({message: 'Internal Server Error'});
    });
});

/*
  @route POST /user/auth/refresh
  @desc Refresh access token
  @access Public

  @param {string} refreshToken

  @return {object} user
*/
router.post('/refresh', verifyRefreshToken, (req, res) => {
  // @ts-ignore
  createSession(req.userId)
    .then((tokens) => {
      res.send(tokens);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({message: 'Internal Server Error'});
    });
});

// send email to verify account
function verifyEmail(token: string, email: string, username: string) {
  return new Promise((resolve, reject) => {
    const verifyUrl = `${process.env.VERIFY_URL}/${token}`;

    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    } as any);

    let templateSource = fs.readFileSync(path.join(__dirname, './../../../templates/verify.html'), 'utf8');

    let template = Handlebars.compile(templateSource);

    let emailData = {
      "username": username,
      "link": verifyUrl
    }

    let mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Verify your account',
      html: template(emailData),
    };

    transporter.sendMail(mailOptions, (err: Error | null, info: any) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve('Email sent');
      }
    });
  });
}

// check if email is valid (regex)
function isEmail(emailAdress: string){
  let regex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-]+)(\.[a-zA-Z]{2,5}){1,2}$/;

  return emailAdress.match(regex) ? true : false;
}

export default router;
