import dotenv from 'dotenv';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import multer, { Multer } from 'multer';
import streamifier from 'streamifier';
import { Prisma } from '@prisma/client';
import { CloudinaryImages } from './typings';

dotenv.config();

const { CLOUD_NAME, API_KEY, API_SECRET } = process.env;

export const cloudinary_constants = {
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
};

interface MulterFile extends Express.Multer.File {
  buffer: Buffer;
}

const storage = multer.memoryStorage();
export const upload: Multer = multer({ storage });

const uploadImageToCloudinary = (
  buffer: Buffer
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.config(cloudinary_constants);
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'product_images' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result) resolve(result);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Function to handle the upload of multiple images
export const uploadImages = async (
  images: MulterFile[]
): Promise<{ url: string; public_id: string }[]> => {
  // Upload the images to Cloudinary and return the public_id and secure_url of each image
  try {
    const uploadedImages = await Promise.all(
      images.map((file) => uploadImageToCloudinary(file.buffer))
    );
    return uploadedImages.map((image) => ({
      url: image.secure_url,
      public_id: image.public_id,
    }));
  } catch (error) {
    console.error('Error uploading images to Cloudinary:', error);
    throw new Error('Failed to upload images');
  }
};

export const transformData = (imagesData: Prisma.JsonValue) => {
  // * MAP OUT THE CLOUDINARY PUBLIC_ID FROM THE IMAGE DB
  const imgs = (imagesData as { url: string; public_id: string }[]).map(
    (item) => {
      return item;
    }
  );
  return imgs;
};

// Delete an image
export async function destroyExistingImage(imagesId: CloudinaryImages[]) {
  cloudinary.config(cloudinary_constants);
  // * IF NO IMAGES DO NOT PROCEEED
  if (!imagesId.length) {
    return null;
  }
  try {
    const isDeleted = await Promise.all(
      imagesId.map(async (img) => {
        const result = await cloudinary.uploader.destroy(img.public_id);
        return result;
      })
    );

    return isDeleted;
  } catch (error: any) {
    return error.message;
  }
}
