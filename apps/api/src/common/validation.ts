import { BadRequestException } from "@nestjs/common";
import { z, type ZodTypeAny } from "zod";

export function parseSchema<TSchema extends ZodTypeAny>(
  schema: TSchema,
  data: unknown
): z.infer<TSchema> {
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
