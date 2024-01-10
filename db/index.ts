import mongoose from 'mongoose';
import config from '../utils/config';

mongoose.connect(config.mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error.message));