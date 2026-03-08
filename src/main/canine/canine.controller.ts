/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CanineService } from './canine.service';
import { RegisterCanineDto, UpdateCanineDto } from './dto/create-canine.dto';
import { CanineQueryDto } from './dto/canine-query.dto';
import { RoleGuard } from 'src/guard/role.guard';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';

@ApiTags('Canine Management')
@ApiBearerAuth()
@Controller('canines')
export class CanineController {
  constructor(private readonly canineService: CanineService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'docs', maxCount: 2 },
    ]),
  )
  @ApiOperation({ summary: 'Register a new canine' })
  async register(
    @Req() req: any,
    @Body() dto: RegisterCanineDto,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; docs?: Express.Multer.File[] },
  ) {
    return await this.canineService.registerCanine(
      req.userId,
      dto,
      files.images || [],
      files.docs || [],
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all canines with pagination/search' })
  async findAll(@Query() query: CanineQueryDto) {
    return await this.canineService.findAll(query);
  }

  @Get(':canineId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get canine details by ID' })
  async findOne(@Param('canineId') canineId: string) {
    return await this.canineService.findOne(canineId);
  }

  @Patch(':canineId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Update canine details' })
  async update(
    @Param('canineId') canineId: string,
    @Req() req: any,
    @Body() dto: UpdateCanineDto,
  ) {
    return await this.canineService.update(
      canineId,
      dto,
      req.userId,
      req.user.role,
    );
  }

  @Delete(':canineId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a canine' })
  async remove(@Param('canineId') canineId: string, @Req() req: any) {
    return await this.canineService.remove(canineId, req.userId, req.user.role);
  }
}
