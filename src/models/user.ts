import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  role: { type: String, default: 'USER' },
  hashedPassword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model('User', UserSchema);
