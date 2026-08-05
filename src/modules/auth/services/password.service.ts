import bcrypt from "bcrypt";
const saltRounds = Number(process.env.SALT_ROUNDS ?? 12);

export const passwordService = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  },

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },
};
