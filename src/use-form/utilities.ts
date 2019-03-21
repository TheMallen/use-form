import {
  Validates,
  NormalizedValidationConfig,
  FieldStates,
  FieldOutput,
  Field
} from "./types";

export function isField<T>(input: FieldOutput<T>): input is Field<T> {
  return (
    input.hasOwnProperty("value") &&
    input.hasOwnProperty("onChange") &&
    input.hasOwnProperty("onBlur") &&
    input.hasOwnProperty("defaultValue")
  );
}

export function mapObject<Output>(
  input: any,
  mapper: (value: any, key: any) => any,
) {
  return Object.keys(input).reduce((accumulator: any, key) => {
    const value = input[key];
    accumulator[key] = mapper(value, key);
    return accumulator;
  }, {}) as Output;
}

export function createValidationConfig<Value, With>(
  input: Validates<Value, With>,
): NormalizedValidationConfig<Value, With> {
  if (typeof input === "function") {
    return {
      using: [input],
    };
  }

  if (Array.isArray(input)) {
    return {
      using: input,
    };
  }

  const { using } = input;
  return {
    ...input,
    using: Array.isArray(using) ? using : [using],
  };
}

export function runValidation<Value, Linked>(
  state: { touched: boolean; value: Value; listItem?: FieldStates<any>; siblings?: any[] },
  validate: NormalizedValidationConfig<Value, Linked>,
) {
  const { touched, value, listItem = {}, siblings = [] } = state;

  if (touched === false) {
    return;
  }

  const error = validate.using
    .map(check =>
      check(value as Value, { linked: validate.with as Linked, listItem, siblings }),
    )
    .filter(value => value != null);

  if (error && error.length > 0) {
    return error[0];
  }
}
