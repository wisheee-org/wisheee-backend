import bcrypt from "bcrypt";
const saltRounds = Number(process.env.SALT_ROUNDS ?? 12);

export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
