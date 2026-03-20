/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleGuard } from 'src/guard/role.guard';
import {
  QueryNotificationDto,
  MarkSelectedReadDto,
} from './dto/notification.dto';
import { RoleType } from 'generated/prisma/enums';

@ApiTags('Admin / Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard) // Sudhu Admin/SuperAdmin access secure kora holo
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // 1. Logged-in Admin tar notification list pabe
  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all notifications for the logged-in admin' })
  @ApiResponse({ status: 200, description: 'Return paginated notifications' })
  async findAll(@Req() req: any, @Query() query: QueryNotificationDto) {
    // Service-e current logged-in admin er ID pathano hocche
    return this.notificationsService.findAll(
      query,
      req.user.id,
      req.user.roleType,
    );
  }

  // 2. Sob gulo read mark kora
  @Patch('mark-all-read')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  async markAllRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  // 3. Selected kichu notification read mark kora
  @Patch('mark-selected-read')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark specific notifications as read' })
  @ApiBody({ type: MarkSelectedReadDto })
  async markSelectedRead(@Body() dto: MarkSelectedReadDto) {
    return this.notificationsService.markSelectedAsRead(dto);
  }

  // 4. Single notification dekha (Automatic read mark hoy service-e)
  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get single notification details' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  // 5. Manual single read mark (optional, jodi findOne e na koren)
  @Patch(':id/read')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  // 6. Specific notification delete kora
  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a specific notification' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id);
  }

  // 7. Admin tar sob notification clear kore fela
  @Delete('clear/all')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete all notifications for the current admin' })
  async clearAll(@Req() req: any) {
    return this.notificationsService.removeAllForUser(req.user.id);
  }
}
