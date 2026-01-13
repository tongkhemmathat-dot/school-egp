import { BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

export function parseSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path.map(String),
      message: err.message
    }));
    throw new BadRequestException({ message: "Validation error", errors });
  }
  return result.data;
}
