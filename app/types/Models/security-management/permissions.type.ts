import type { EditionDatesModelType, EditorModelType } from "~/types/models/common.type";


export interface PermissionModel 
extends EditionDatesModelType ,EditorModelType
{
  id: number;
  name: string;
  guard_name?: string;
};