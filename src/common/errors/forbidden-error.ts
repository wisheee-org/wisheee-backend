import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(code: string, message: string) {
    super(403, code, message);
  }
}
