import { Schema, model } from 'mongoose';
import { User } from '../../utils/interfaces';

const UserSchema = new Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: false,
  },
  refreshTokenExp: {
    type: Date,
    required: false,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  verifyToken: {
    type: String,
    required: false,
  },
  verifyTokenExp: {
    type: Date,
    required: false,
  },
}, { timestamps: true });

const User = model('User', UserSchema);

export default User;