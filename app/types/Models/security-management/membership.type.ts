import type { AxiosResponse } from "axios";

export enum MEMBER_TYPE {
  PLAYER = "individual",
  MANAGER = "manager",
}


export enum STATUS_TYPE {
  INITIATED = "INITIATED",
  COMPLETED = "COMPLETED",
}

export enum TYPE_DATA {
  MEMBER = "members",
  MEMBERSHIP = "memberships",
}

export type Link_Type = {
  self: string;
  related?: string;
};

export interface MembershipModel {
  active: boolean;
  amount: number;
  completed_at: string | null;
  created_at: string | null;
  end_at: string | null;
  id: string;
  initiated_at: string;
  links: Link_Type;
  reference: string;
  start_at: string;
  status: STATUS_TYPE;
  type: string;
  updated_at: string | null;
}

export interface PackageModel {
  count_days: number;
  created_at: string | null;
  description: string;
  id: string;
  links: Link_Type;
  maximum_persons: number | null;
  name: string;
  package_type: string | null;
  type: string;
  price: number;
  updated_at: string | null;
}

export interface MemberExtendedModel {
  created_at: string | null;
  email: string;
  firstname: string;
  fullname: string;
  id: string;
  image_profil?: string;
  initials: string;
  lastname: string;
  licence_activated: boolean;
  licence_key: string;
  links: Link_Type;
  memberships: MembershipModel[];
  package: PackageModel;
  phone: string;
  relationshipNames: string[];
  type: string;
  username: string;
  user: UserModel | null;
  updated_at: string | null;
}

export interface MemberModel {
  created_at: string | null;
  email: string;
  firstname: string;
  fullname: string;
  id: string;
  image_profil?: string;
  initials: string;
  lastname: string;
  licence_activated: boolean;
  licence_key: string;
  links: Link_Type;
  has_credentials?: boolean;
  phone: string;
  relationshipNames: string[];
  type: string;
  username: string;
  updated_at: string | null;
}

export interface ProfileModel{
  user : MemberModel,
  bio:string,
  location:string,
  birthDate:Date,
  gender:string,
  languages:string[],
}

export interface UserModel extends MembershipModel, MemberModel, PackageModel {
  is_active: number | boolean | null;
  is_2fa_enabled: boolean;
  entity_id : string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  adresse: string | null;
  website: string | null;
}

export interface SendOtpParams {
  identifier: string
  action:  'reset_password' | 'verify_email'
  query?: Record<string, any>
}


export interface ResendOtpParams {
  identifier: string
  action:  'reset_password' | 'verify_email'
  query?: Record<string, any>
}


export interface VerifyOtpParams {
  identifier: string
  code: string
  action:  'reset_password' | 'verify_email'
  query?: Record<string, any>
}
export type FormType = {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  member_type: string;
};

export type Yup_Form_Type = {
  email: string | undefined;
  firstname: string;
  lastname: string;
  phone: string | undefined;
  password: string;
  password_confirmation: string;
};

export type Password_Object = {
  password: string;
  password_confirmation: string;
};

export interface MemberResponse {
  datas: MemberModel;
  response: AxiosResponse;
}
