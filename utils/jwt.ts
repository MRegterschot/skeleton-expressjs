import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from './config';
import { User } from '../db/models';
import bcrypt from 'bcrypt';

const authenticate = (req, res, next) => {
  let accessToken = req.headers['x-access-token'];
  if (!accessToken)
    return res.status(401).send({ auth: false, message: 'No token provided.' });

  jwt.verify(accessToken, config.jwtSecret, function (err, decoded) {
    if (err && err.name === 'TokenExpiredError')
      return res.status(401).send({ auth: false, message: 'Token expired.' });
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: 'Failed to authenticate token.' });

    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });
};

const publicRoute = (req, res, next) => {
  let accessToken = req.headers['x-access-token'];
  if (!accessToken) return next();

  jwt.verify(accessToken, config.jwtSecret, function (err, decoded) {
    if (err) return next();

    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });
};

const verifyRefreshToken = async (req, res, next) => {
  let refreshToken = req.body.refreshToken;
  if (!refreshToken)
    return res.status(401).send({ auth: false, message: 'No token provided.' });

  let id = req.body.id;
  if (!id)
    return res
      .status(401)
      .send({ auth: false, message: 'No user id provided.' });

  User.findOne({ _id: id, refreshToken }).then((user) => {
    if (!user)
      return res.status(401).send({ auth: false, message: 'Invalid token.' });

    req.userId = user._id;
    req.refreshToken = user.refreshToken;

    if (user.refreshTokenExp < new Date())
      return res.status(401).send({ auth: false, message: 'Token expired.' });

    next();
  });
};

const generateAccessToken = (userId: string) => {
  return new Promise((resolve, reject) => {
    let accessToken = jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiration.access,
    });

    return resolve(accessToken);
  });
};

const generateRefreshToken = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if (err) return reject(err);

      let refreshToken: string = buf.toString('hex');

      return resolve(refreshToken);
    });
  });
};

const saveRefreshToken = (userId: string, refreshToken: string) => {
  return new Promise((resolve, reject) => {
    let refreshTokenExp = new Date(
      new Date().setDate(new Date().getDate() + config.jwtExpiration.refresh)
    );

    User.findByIdAndUpdate(
      userId,
      {
        refreshToken,
        refreshTokenExp,
      },
      { new: true }
    )
      .then((user) => {
        if (!user) return reject('User not found');

        return resolve(refreshToken);
      })
      .catch((err) => {
        return reject(err);
      });
  });
};

const createSession = (userId: string) => {
  return new Promise((resolve, reject) => {
    generateRefreshToken()
      .then((refreshToken: string) => {
        return saveRefreshToken(userId, refreshToken);
      })
      .then(async (refreshToken) => {
        return generateAccessToken(userId).then((accessToken) => {
          return resolve({ accessToken, refreshToken });
        }).catch((err) => {
          return reject(err);
        });
      })
      .catch((err) => {
        return reject(err);
      });
  });
};

const confirmWithPassword = (req, res, next) => {
  let userId = req.userId;
  let password = req.body.password;

  if (!password)
    return res
      .status(401)
      .send({ auth: false, message: 'No password provided.' });

  User.findById(userId)
    .then((user) => {
      if (!user)
        return res.status(401).send({ auth: false, message: 'Invalid user.' });

      bcrypt
        .compare(password, user.password)
        .then((match) => {
          if (!match)
            return res
              .status(401)
              .send({ auth: false, message: 'Invalid password.' });

          next();
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).send('Internal Server Error');
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('Internal Server Error');
    });
};

export { authenticate, createSession, verifyRefreshToken, confirmWithPassword, publicRoute };
