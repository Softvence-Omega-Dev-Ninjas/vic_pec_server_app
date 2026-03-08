/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/common/cloudinary/cloudinary.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'ads' },
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              return reject(
                new InternalServerErrorException('Cloudinary Upload Failed'),
              );
            }
            if (result?.secure_url) {
              resolve(result.secure_url); // Ekhon r error dibe na
            } else {
              reject(
                new InternalServerErrorException(
                  'Cloudinary response missing URL',
                ),
              );
            }
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });

    return Promise.all(uploadPromises);
  }
}
