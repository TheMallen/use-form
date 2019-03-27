import { ChangeEvent } from "react";
import {
  Validates,
  NormalizedValidationConfig,
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
  mapper: (value: any, key: any) => any
) {
  return Object.keys(input).reduce((accumulator: any, key) => {
    const value = input[key];
    accumulator[key] = mapper(value, key);
    return accumulator;
  }, {}) as Output;
}

export function createValidationConfig<Value, With, Context>(
  input: Validates<Value, With, Context>
): NormalizedValidationConfig<Value, With, Context> {
  if (typeof input === "function") {
    return {
      using: [input]
    };
  }

  if (Array.isArray(input)) {
    return {
      using: input
    };
  }

  const { using } = input;
  return {
    ...input,
    using: Array.isArray(using) ? using : [using]
  };
}

export function isChangeEvent(
  value: any
): value is ChangeEvent<HTMLInputElement> {
  return (
    typeof value === "object" &&
    Reflect.has(value, "target") &&
    Reflect.has(value.target, "value")
  );
}
