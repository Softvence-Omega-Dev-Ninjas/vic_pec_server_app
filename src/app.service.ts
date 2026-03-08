import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      status: 'up',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      developer: {
        name: 'Shariyer Shazan',
        role: 'Software Engineer',
        email: 'shariyershazan1@gmail.com',
        github: 'https://github.com/shariyerShazan',
      },
    };
  }
}
