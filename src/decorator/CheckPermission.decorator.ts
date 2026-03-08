import { SetMetadata } from '@nestjs/common';
import { ResourceType } from 'generated/prisma/enums';
import { PermissionAction } from 'src/main/admin/permission/permission.service';

export const CHECK_PERMISSION = 'check_permission';

export const CheckPermission = (
  resource: ResourceType,
  action: PermissionAction,
) => SetMetadata(CHECK_PERMISSION, { resource, action });
