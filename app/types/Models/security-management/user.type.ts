import type {
  EditionDatesModelType,
  EditorModelType,
} from "~/types/models/common.type";
import type { OrganizationModel } from "~/types/models/security-management/organization.type";

export type LoginCredentialType = {
  identifier: string | null;
  password: string | null;
  remember?: boolean;
  guard: string;
};

export type RegisterCredentialType = {
  email : string | null;
  username:string
  firstname : string;
  lastname : string;
  phone : string | null;
  password: string;
  password_confirmation: string;
}

export type PasswordResetConfirm = {
  identifier: string;
  code: string;
  password: string;
  password_confirmation: string;
  guard: string;
}


export type HasManagerModel = {
  manager_id?: number;
  manager?: UserModel | null;
};

export type HasOrganizationModel = {
  organization_id?: number | null;
  organization?: OrganizationModel | null;
};

export interface UserModel
  extends HasManagerModel,
    HasOrganizationModel,
    EditionDatesModelType,
    EditorModelType {
  id?: number | string;
  firstname: string;
  las_name?: string | null;
  fullname?: string | null;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  email_verified_at?: string;
  is_manager?: boolean;
  remember_token?: string | null;
  permissions?: string[];
}


