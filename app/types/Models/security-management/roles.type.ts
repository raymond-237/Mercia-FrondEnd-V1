
import type { EditionDatesModelType, EditorModelType } from "~/types/models/common.type";
import type { HasOrganizationModel } from "~/types/models/security-management/user.type";
import type { PermissionModel } from "~/types/models/security-management/permissions.type";


export interface RoleModel 
extends EditionDatesModelType ,EditorModelType,HasOrganizationModel
{
  id: number;
  name: string;
  guard_name?: string | null;
  permissions?: PermissionModel[] | null;
};