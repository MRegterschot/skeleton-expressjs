export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  refreshToken?: string;
  refreshTokenExp?: Date;
  verified?: boolean;
  verifyToken?: string;
  verifyTokenExp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};