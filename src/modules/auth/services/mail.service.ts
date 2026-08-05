import { logger } from "@/config/log";

export const mailService = {
  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

    // TODO change to resend.emails.send(...)
    logger.info(url);
  },
};
