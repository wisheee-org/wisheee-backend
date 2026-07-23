import { AppError } from "./app-error";

export class UnauthrizedError extends AppError {
  constructor(code: string, message: string) {
    super(401, code, message);
  }
}
