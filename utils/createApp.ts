import express, { Express } from 'express';
import routes from "./../routes";
import cors from 'cors';

export function createApp(): Express {
  const app = express();
  app.use(cors({
    origin: [
      "https://setups.top",
      "http://localhost:3000",
      "https://www.setups.top",
      "https://development.setups.top",
    ],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, id');
    res.setHeader('Access-Control-Expose-Headers', 'x-access-token, x-refresh-token');
    next();
  });

  app.use("/", routes)

  app.use('/uploads', express.static('uploads'));

  return app;
}
