// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const UserSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     resetToken: { type: String },
//     resetTokenExpire: { type: Date }
// });

// const User = mongoose.model('User', UserSchema);

// export default User;


import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false }, // Changed to optional
  mobile: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpires: { type: Date },
  location: {
    city: { type: String, default: 'Unknown' },
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
});

const User = mongoose.model('User', UserSchema);

export default User;