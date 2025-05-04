// import express from 'express';
// import { login, register, forgotpassword,adminlogin,resetpassword,getname } from '../controller/Usercontroller.js';
// import authMiddleware from '../middleware/authmiddleware.js';


// const userrouter = express.Router();

// userrouter.post('/login', login);
// userrouter.post('/register', register);
// userrouter.post('/forgot', forgotpassword);
// userrouter.post('/reset/:token', resetpassword);
// userrouter.post('/admin', adminlogin);
// userrouter.get('/me', authMiddleware, getname);

// export default userrouter;


import express from 'express';
import {
  sendRegisterOTP,
  verifyRegisterOTP,
  sendLoginOTP,
  verifyLoginOTP,
  adminLogin,
  logout,
  getName,
} from '../controller/Usercontroller.js';
import authMiddleware from '../middleware/authmiddleware.js';

const userrouter = express.Router();

userrouter.post('/register/send-otp', sendRegisterOTP);
userrouter.post('/register/verify-otp', verifyRegisterOTP);
userrouter.post('/login/send-otp', sendLoginOTP);
userrouter.post('/login/verify-otp', verifyLoginOTP);
userrouter.post('/admin', adminLogin);
userrouter.post('/logout', logout);
userrouter.get('/me', authMiddleware, getName);

export default userrouter;