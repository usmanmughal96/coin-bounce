const JWTService = require('../services/JWTService');
const User = require('../models/user');
const UserDTO = require('../dto/user');

const auth = async (req, res, next) => {
  try {
    // 1. Validate access and refresh tokens
    const { refreshToken, accessToken } = req.cookies;
    if (!refreshToken || !accessToken) {
      const error = {
        status: 401,
        message: 'Unauthorized',
      };
      return next(error);
    }

    let _id;
    try {
      _id = JWTService.verifyAccessToken(accessToken);
    } catch (error) {
      return next(error); // Handle token verification error
    }

    let user;
    try {
      user = await User.findOne({ _id });
    } catch (error) {
      return next(error); // Handle database query error
    }

    if (!user) {
      const error = {
        status: 401,
        message: 'Unauthorized',
      };
      return next(error);
    }

    const userDto = new UserDTO(user);
    req.user = userDto;
    next();
  } catch (error) {
    return next(error); // Handle unexpected errors
  }
};

module.exports = auth;
