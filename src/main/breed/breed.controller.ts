/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BreedService } from './breed.service';
import { CreateBreedDto, UpdateBreedDto } from './dto/create-breed.dto';
import { RoleGuard } from 'src/guard/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleType } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { BreedQueryDto } from './dto/BreedQueryDto';

@ApiTags('Breed Management')
@ApiBearerAuth()
@Controller('admin/breeds')
export class BreedController {
  constructor(private readonly breedService: BreedService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Create a new breed' })
  async create(@Body() createBreedDto: CreateBreedDto) {
    return await this.breedService.create(createBreedDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return await this.breedService.findAll();
  }

  @Get(':breedId')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('breedId') breedId: string) {
    return await this.breedService.findOne(breedId);
  }

  @Patch(':breedId')
  @Roles(RoleType.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async update(
    @Param('breedId') breedId: string,
    @Body() updateBreedDto: UpdateBreedDto,
  ) {
    return await this.breedService.update(breedId, updateBreedDto);
  }

  @Delete(':breedId') // id এর বদলে breedId
  @Roles(RoleType.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('breedId') breedId: string) {
    return await this.breedService.remove(breedId);
  }

  @Get('get-all/sort')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all breeds with pagination and search' })
  async getAllWithPagination(@Query() query: BreedQueryDto) {
    return await this.breedService.findAllWithPagination(query);
  }
}
