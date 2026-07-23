import bcrypt from "bcrypt";
const saltRounds = Number(process.env.SALT_ROUNDS ?? 12);

export class PasswordService {
  hash = (password: string) => {
    return bcrypt.hash(password, saltRounds);
  };

  compare = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  };
}
