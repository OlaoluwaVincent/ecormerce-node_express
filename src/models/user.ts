import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  id: { type: String, default: uuidv4 },
  username: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  hashedPassword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model('User', UserSchema);
