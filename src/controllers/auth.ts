import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/prisma';
import { generateToken, verifyToken } from '../utils/token';
import { Role, UserRequest } from '../utils/typings';
import BadRequestException from '../exceptions/BadRequestException';
import NotFoundException from '../exceptions/NotFoundException';
import HttpStatus from '../exceptions/httpStatus';
import Exception from '../exceptions/Exception';

const createUser = async (req: Request, res: Response) => {
  const { fullname, email, username, password } = req.body as {
    fullname: string;
    email: string;
    username: string;
    password: string;
  };

  if (!fullname || !email || !username || !password) {
    throw new BadRequestException('All fields required');
  }

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new BadRequestException('Username or Email Already exists');
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user instance
  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      name: fullname,
      email: email.toLowerCase(),
      role: 'USER',
      hashedPassword,
    },
  });

  if (!user)
    throw new BadRequestException('Failed to Create Account for =>' + username);

  const { username: name } = user;

  // Respond with success message
  res.status(HttpStatus.CREATED).json(name);
};

const authUser = async (req: Request, res: Response) => {
  // {username:string password:string}
  const { username, password } = req.body as {
    username: string;
    password: string;
  };

  const user = await prisma.user.findFirst({
    where: { username: username.toLowerCase() },
  });

  if (!user) throw new BadRequestException('Wrong Username or Password');

  if (!bcrypt.compareSync(password, user.hashedPassword))
    throw new BadRequestException('Wrong Username or Password');

  const { hashedPassword, refreshToken, ...rest } = user;

  const token = generateToken(rest);

  const refresh_Token = generateToken(rest, '7d');

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      refreshToken: refresh_Token,
    },
  });

  res.status(HttpStatus.OK).json({ ...rest, token, refreshToken });
};

const getAllusers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
    },
  });
  res.status(HttpStatus.OK).json(users);
};

const getSpecificUser = async (req: Request, res: Response) => {
  if (!req.params.id) {
    throw new BadRequestException('Please provide user id');
  }
  const user = await prisma.user.findFirst({
    where: { id: req.params.id },
  });

  if (!user) throw new NotFoundException('user does not exists');

  const { hashedPassword, refreshToken, createdAt, ...rest } = user;

  res.status(HttpStatus.OK).json(rest);
};

const deleteUser = async (req: UserRequest, res: Response) => {
  const { user } = req;

  if (user?.id === req.params.id || user?.role === Role.ADMIN) {
    const deleted = await prisma.user.delete({
      where: { id: req.params.id },
    });
    if (!deleted) throw new BadRequestException('Failed to Delete');

    return res.status(HttpStatus.OK).json('User has been deleted');
  } else {
    throw new Exception(HttpStatus.FORBIDDEN, 'You do not own this resource');
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { username, name } = req.body;
  await prisma.user.update({
    where: { id: req.params.id },
    data: {
      name,
      username,
    },
  });

  res.status(HttpStatus.OK).json('User updated');
};

const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findFirst({ where: { id: req.params.id } });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!bcrypt.compare(currentPassword, user?.hashedPassword)) {
    throw new BadRequestException('Old password does not match');
  }

  if (newPassword.length < 8)
    throw new BadRequestException('Password must be at least 8 digits');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
    },
  });

  res.status(HttpStatus.OK).json('Password updated successfully');
};

const refreshToken = async (req: Request, res: Response) => {
  const refresh_token = req.body.refreshToken as string;
  if (!refresh_token) {
    return new BadRequestException('Please provide a refreshToken');
  }

  const userToken = verifyToken(refresh_token);

  const user = await prisma.user.findUnique({ where: { id: userToken.id } });

  if (!user) {
    throw new NotFoundException('User does not exist');
  }
  const { hashedPassword, refreshToken, ...rest } = user;

  let new_refresh_token: string;
  // Check if the refresh token has expired
  if (userToken.exp < Math.floor(Date.now() / 1000)) {
    new_refresh_token = generateToken(rest, '7d');
    prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: new_refresh_token,
      },
    });
  } else {
    new_refresh_token = refresh_token; // Keep the existing refresh token
  }

  const newToken = generateToken(rest);

  res
    .status(HttpStatus.OK)
    .json({ ...rest, token: newToken, refreshToken: new_refresh_token });
};

export default {
  createUser,
  getAllusers,
  getSpecificUser,
  authUser,
  deleteUser,
  updateUser,
  changePassword,
  refreshToken,
};
