import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/prisma';
import { generateToken, verifyToken } from '../utils/token';
import { Role, UserRequest } from '../utils/typings';
import BadRequestException from '../exceptions/BadRequestException';
import NotFoundException from '../exceptions/NotFoundException';
import HttpStatus from '../exceptions/httpStatus';
import asyncHandler from '../exceptions/AsyncHandler';

const createUser = async (req: Request, res: Response) => {
  try {
    const { fullname, email, username, password } = req.body;

    if (!fullname || !email || !username || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user instance
    const user = await prisma.user.create({
      data: {
        username,
        name: fullname,
        email,
        role: 'USER',
        hashedPassword,
      },
    });

    if (!user) res.status(400).json({ message: 'Failed to create account' });

    const { hashedPassword: pword, ...rest } = user;

    // Respond with success message
    res.status(201).json({ message: 'User added successfully', user: rest });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const authUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { username },
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

  res.status(200).json({ ...rest, token, refreshToken });
});

const getAllusers = async (_req: Request, res: Response) => {
  try {
    let user = await prisma.user.findMany({
      select: {
        email: true,
        id: true,
        role: true,
        username: true,
        name: true,
      },
    });
    res.status(200).json({ users: user });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const getSpecificUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id },
    });

    if (!user) return res.status(404).json('user does not exists');

    res.status(200).json(user);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const deleteUser = async (req: UserRequest, res: Response) => {
  const { user } = req;
  try {
    if (user?.id === req.params.id || user?.role === Role.ADMIN) {
      const deleted = await prisma.user.delete({
        where: { id: req.params.id },
      });
      if (!deleted) res.status(400).json({ message: 'Failed to Delete' });

      return res.status(200).json({ message: 'User has been deleted' });
    } else {
      return res.status(401).json({ message: 'You do not own this resource' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { username, name } = req.body;
  prisma.user
    .update({
      where: { id: req.params.id },
      data: {
        name,
        username,
      },
    })
    .then((user) =>
      res.status(200).json({ message: 'User updated successfully' })
    )
    .catch((err: any) =>
      res
        .status(500)
        .json({ message: 'Internal server error', err: err.message })
    );
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findFirst({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!bcrypt.compare(currentPassword, user?.hashedPassword))
      return res.status(404).json({ message: 'Wrong password', user });

    if (newPassword.length < 8)
      return res.status(404).json('Password must be at least 8 digits');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
      },
    });

    res.status(200).json('Password updated successfully');
  } catch (err: any) {
    res
      .status(500)
      .json({ message: 'Internal server error', err: err.message });
  }
};

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refresh_token = req.body.refreshToken as string;
  if (!refresh_token) {
    return new BadRequestException('Please provide a refresh_token');
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
});

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
