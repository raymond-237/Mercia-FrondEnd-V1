import type { EditionDatesModelType, EditorModelType } from "~/types/models/common.type";
import type { HasManagerModel } from "~/types/models/security-management/user.type";


export interface OrganizationModel 
  extends HasManagerModel,EditionDatesModelType,EditorModelType 
{
  id: number;
  name: string;
  email?: string | null;
  phone?: string;
}

export type HasOrganizationModel = {
    organization_id?: number | null;
    organization?: OrganizationModel | null;
}