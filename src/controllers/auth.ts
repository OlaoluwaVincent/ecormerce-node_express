import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user';
import { generateToken } from '../utils/token';
import { UserRequest } from '../utils/typings';

const createUser = async (req: Request, res: Response) => {
  try {
    const { fullname, email, username, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email }).exec();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user instance
    const user = new User({
      username,
      fullname,
      hashedPassword, // Store hashed password with the field name defined in your schema
    });

    // Save the user to the database
    await user.save();

    // Set the token in the response header

    // Respond with success message
    res.status(200).json({ message: 'User added successfully' });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const authUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username });

    if (!user) return res.status(404).json('Wrong Username or Password');
    const userObj = user.toObject();

    if (!bcrypt.compareSync(password, userObj.hashedPassword))
      return res.status(404).json('Wrong Username or Password');
    const { hashedPassword, createdAt, updatedAt, ...rest } = userObj;

    const token = generateToken(rest);

    res.status(200).json({ ...rest, token });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const getAllusers = async (_req: Request, res: Response) => {
  try {
    let user = await User.find();
    res.status(200).json(user);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const getSpecificUser = async (req: Request, res: Response) => {
  try {
    const user = (await User.findOne({ _id: req.params.id })) as any;

    if (!user) return res.status(404).json('user does not exists');

    res.status(200).json(user);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  User.findByIdAndDelete({ _id: req.params.id })
    .then((user) =>
      res.status(200).json({ message: 'User deleted successfully', user })
    )
    .catch((err: any) =>
      res
        .status(500)
        .json({ message: 'Internal server error', err: err.message })
    );
};

const updateUser = async (req: Request, res: Response) => {
  User.findByIdAndUpdate({ _id: req.params.id }, { $set: { $eq: req.body } })
    .then((user) =>
      res.status(200).json({ message: 'User updated successfully', user })
    )
    .catch((err: any) =>
      res
        .status(500)
        .json({ message: 'Internal server error', err: err.message })
    );
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, ConfirmnewPassword } = req.body;

    const user = (await User.findOne({ _id: req.params.id })) as any;
    console.log(user);

    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(404).json({ message: 'Wrong password', user });

    if (newPassword.length < 8)
      return res.status(404).json('Password must be at least 8 digits');

    if (newPassword.localeCompare(ConfirmnewPassword))
      return res.status(404).json('New passwords do not match');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json('Password updated successfully');
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

export default {
  createUser,
  getAllusers,
  getSpecificUser,
  authUser,
  deleteUser,
  updateUser,
  changePassword,
};
