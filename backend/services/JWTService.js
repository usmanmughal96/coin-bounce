const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require('../config/index'); 

const RefreshToken = require('../models/token');

class JWTService {

  static signAccessToken(payload, expiry) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiry });
  }

  static signRefreshToken(payload, expiry) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiry }); 
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  }

  static async storeRefreshToken(token, userId) {
    const newToken = new RefreshToken({
      token, 
      userId
    });
    await newToken.save();
  }

  static async deleteExpiredTokens() {
    const expiredTokens = await RefreshToken.find({ 
      expires: { $lt: new Date() }
    });
    await RefreshToken.deleteMany(expiredTokens);
  }

  static async deleteUserTokens(userId) {
    await RefreshToken.deleteMany({ userId });
  }

}

module.exports = JWTService;