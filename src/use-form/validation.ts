import { ValidationContext } from "./types";

interface Matcher<Input, Linked> {
  (input: Input, context: ValidationContext<Linked>): boolean;
}

interface ErrorContentFunction<Input> {
  (input: Input): string;
}

type ErrorContent<Input> = string | ErrorContentFunction<Input>;

export function validate<Input, Linked = never>(
  matcher: Matcher<Input, Linked>,
  errorContent: ErrorContent<Input>,
) {
  return (input: Input, context: ValidationContext<Linked>) => {
    const matches = matcher(input, context);

    if (matches) {
      return;
    }

    if (typeof errorContent === "function") {
      return errorContent(input);
    }

    return errorContent;
  };
}

export function lengthMoreThan(length: number, error: ErrorContent<string>) {
  return validate((input) => {
    return input.length > length;
  }, error);
}

export function notEmpty(error: ErrorContent<string>) {
  return validate((input) => {
    return input !== "";
  }, error);
}

export function numeric(error: ErrorContent<string>) {
  return validate((input) => {
   return input !== "" && (input.match(/[^0-9.,]/g) || []).length === 0;
  }, error);
}
