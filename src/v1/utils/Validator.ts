import { validate } from "class-validator";
import appError from "./AppError";

export const validateInput = async (dto: any) => {
  const validationErrors = await validate(dto);

  if (validationErrors.length > 0) {
    const errors = validationErrors
      .map((error) => Object.values(error.constraints || {}))
      .flat();

    throw new appError(`Validation failed: ${errors.join(", ")}`, 400);
  }
};
