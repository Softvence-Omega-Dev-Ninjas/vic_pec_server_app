/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoleType } from 'generated/prisma/enums';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleGuard } from 'src/guard/role.guard';
import { LitterService } from '../litter/litter.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import {
  CreateLitterDto,
  UpdateLitterDto,
} from '../litter/dto/create-litter.dto';
import { LitterQueryDto } from './dto/LitterQueryDto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Litter Management')
@ApiBearerAuth()
@Controller('litters')
export class LitterController {
  constructor(private readonly litterService: LitterService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleType.OWNER)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new litter with images and documents' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'DNAdocuments', maxCount: 2 }, // Ekhane 'docs' chhilo, eta change hobe
    ]),
  )
  async register(
    @Body() body: any,
    @Req() req: any,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      DNAdocuments?: Express.Multer.File[];
    },
  ) {
    if (typeof body.puppies === 'string') {
      body.puppies = JSON.parse(body.puppies);
    }
    const dto = plainToInstance(CreateLitterDto, body);

    return await this.litterService.createLitter(
      req.userId,
      dto,
      files.images || [],
      files.DNAdocuments || [],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all litters with pagination, search and filters',
  })
  async findAll(@Query() query: LitterQueryDto) {
    return await this.litterService.findAll(query);
  }

  @Get(':litterId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single litter by litterId' })
  async findOne(@Param('litterId') litterId: string, @Req() req: any) {
    return await this.litterService.findOne(
      litterId,
      req.userId,
      req.user?.role,
    );
  }

  @Patch(':litterId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleType.OWNER, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update litter details' })
  async update(
    @Param('litterId') litterId: string,
    @Body() dto: UpdateLitterDto,
    @Req() req: any,
  ) {
    return await this.litterService.update(litterId, dto, req.userId);
  }

  @Delete('admin/:litterId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a litter' })
  async remove(@Param('litterId') litterId: string, @Req() req: any) {
    return await this.litterService.remove(litterId, req.userId, req.user.role);
  }

  @Get('my-litters/own')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get litters owned by the current user' })
  async getMyLitters(@Req() req: any, @Query() query: LitterQueryDto) {
    return await this.litterService.getMyLitters(req.userId, query);
  }
}
