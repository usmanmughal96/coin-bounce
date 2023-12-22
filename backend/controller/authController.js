const UserDTO = require('../dto/user');
const bcrypt = require('bcryptjs');
const JWTService = require('../services/JWTService');
const RefreshToken=require('../models/token');
const saltRounds = 5;
const Joi = require('joi');
const User = require('../models/user');
const user = require('../models/user');
const pattern = RegExp('^(?=.*[0-9])');
const registrationSchema = Joi.object({
  name: Joi.string().min(5).max(30).required(),
  username: Joi.string().min(5).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required().pattern(pattern),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

const authController = {
  async register(req, res, next) {
    try {
      const { error } = registrationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { name, username, email, password } = req.body;

      const emailExists = await User.exists({ email });
      if (emailExists) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const usernameExists = await User.exists({ username });
      if (usernameExists) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      let accessToken;
      let refreshToken;

      try {
        const user = await new User({
          name,
          username,
          email, 
          password: hashedPassword,
        }).save();

        accessToken = JWTService.signAccessToken(
          { _id: user._id },
          '30m'
        );
        refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');
       await JWTService.storeRefreshToken(refreshToken, user._id);
  
        res.cookie('accessToken', accessToken, {
          maxAge: 1000 * 60 * 30, // 30 minutes
          httpOnly: true,
        });

        res.cookie('refreshToken', refreshToken, {
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          httpOnly: true,
        });

        // res.status(201).json({
        //   id: user._id,
        //   username: user.username,
        //   name: user.name,
        //   email: user.email,
        // });
        const userDto = new UserDTO(user);

        return res.status(200).json({ user: userDto, auth: true });

      } catch (error) {
        return next(error);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res, next) {
    try {
      const userLoginSchema = Joi.object({
        username: Joi.string().min(5).max(30).required(),
        password: Joi.string().pattern(pattern),
      });

      const { error } = userLoginSchema.validate(req.body);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { username, password } = req.body;

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(401).json({ error: 'Invalid Username or Password' });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ error: 'Invalid Username or Password' });
      }

      // let accessToken;
      // let refreshToken;
      const accessToken=JWTService.signAccessToken({_id:user._id}, '30m');
      const refreshToken=JWTService.signRefreshToken({_id:user._id}, '60m');
      
      try{

       await RefreshToken.updateOne({
          _id:user._id
        },
        {token:refreshToken},
        {upsert:true}
        ); 
  
      }
      catch(error){
        return next(error);
      }
      
      res.cookie('accessToken',accessToken,{
        maxAge:1000*60*60*24,
        httpOnly:true
      });

      res.cookie('refreshToken',refreshToken,{
        maxAge:1000*60*60*24,
        httpOnly:true
      });

      const userDto = new UserDTO(user);

      return res.status(200).json({ user: userDto, auth: true });
    } catch (error) {
      return next(error);
    }
  },
  async logout(req, res, next) {
 //   console.log(req);
    try {
      // Check if refreshToken exists in cookies
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res.status(400).json({ error: 'No refresh token found' });
      }
  
      // Delete the refresh token from the database
      try {
        await RefreshToken.deleteOne({ token: refreshToken });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to delete refresh token' });
      }
  
      // Clear cookies
      try {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to clear cookies' });
      }
  
      // Send a success response to the user
      res.status(200).json({ user: null, auth: false });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  async refresh(req, res, next) {
    let id; // Declare id outside the try block
  
    // 1. get refresh token from cookies
    const originalRefreshToken = req.cookies.refreshToken;
  
    try {
      id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
    } catch (e) {
      const error = {
        status: 401,
        message: 'Unauthorized',
      };
      return next(error);
    }
  
    // 2. refresh token verify
    try {
      const match = await RefreshToken.findOne({ _id: id, token: originalRefreshToken });
      if (!match) {
        const error = {
          status: 401,
          message: 'Unauthorized',
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
  
    // 3. generate new token
    try {
      const accessToken = JWTService.signAccessToken({ _id: id }, '30m');
      const refreshToken = JWTService.signRefreshToken({ _id: id }, '60m');
  
      await RefreshToken.updateOne({ _id: id }, { token: refreshToken });
      res.cookie('accessToken', accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
  
      res.cookie('refreshToken', refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
    } catch (e) {
      return next(e);
    }
  
    // 4. update db and return response
    const user = await User.findOne({ _id: id });
    const userDto = new UserDTO(user);
    return res.status(200).json({ user: userDto, auth: true });
  }
   
};

module.exports = authController;
