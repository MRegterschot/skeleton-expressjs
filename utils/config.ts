import { config as initEnv } from "dotenv";
import fs from "fs";
import path from "path";

fs.existsSync(path.join(__dirname, "./../.env"))
  ? initEnv()
  : console.log("No .env file found, please create one!");

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  websiteUrl: process.env.WEBSITE_URL || "http://localhost:3000",
  mongoUrl: `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_DATABASE}`,
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiration: {
    access: process.env.JWT_EXPIRATION_ACCESS || "15m",
    refresh: parseInt(process.env.JWT_EXPIRATION_REFRESH as string) || 30,
  }
};

export default config;