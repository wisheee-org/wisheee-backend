export interface UserSignUpDto {
  email: string;
  password: string;
  username: string;
  avatar?: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}
