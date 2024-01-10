import { Router } from 'express';
import { User } from '../../db/models';
import { authenticate, confirmWithPassword } from '../../utils/jwt';
import auth from './auth';

const router = Router();

router.use('/', auth);

router.get('/me', authenticate, (req, res) => {
  // @ts-ignore
  User.findById(req.userId)
    .then((user) => {
      if (!user) return res.status(404).send({message: 'User not found'});

      res.send({
        username: user.username,
        email: user.email,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({message: 'Internal Server Error'});
    });
});

router.patch('/update', authenticate, (req, res) => {
  const { username } = req.body;

  // @ts-ignore
  User.findById(req.userId)
    .then(async (user) => {
      if (!user) return res.status(404).send({message: 'User not found'});

      if (username) user.username = username;

      user
        .save()
        .then((user) => {
          res.send({username: user.username});
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

router.delete('/delete', authenticate, confirmWithPassword, (req, res) => {
  // @ts-ignore
  User.findByIdAndDelete(req.userId)
    .then((user) => {
      if (!user) return res.status(404).send({message: 'User not found'});
      res.send({ message: 'User deleted' });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({message: 'Internal Server Error'});
    });
});

export default router;
