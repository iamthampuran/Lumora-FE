export interface CurrentUserResponse {
  profileUrl: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  bio: string | null;
  isTwoFactorEnabled: boolean;
}