import {ChangeEvent} from 'react';

export type ErrorValue = string | undefined;

export interface Validator<Value, Linked, Context> {
  (value: Value, context: Context): ErrorValue;
}

export interface ValidationContext<Linked> {
  linked: Linked;
}

export interface NormalizedValidationConfig<Value, Linked, Context> {
  using: Validator<Value, Linked, Context>[];
  with?: Linked;
}

export interface ValidationConfig<Value, Linked, Context> {
  using: Validator<Value, Linked, Context> | Validator<Value, Linked, Context>[];
  with?: Linked;
}

export type Validates<Value, Linked, Context = ValidationContext<Linked>> =
  | Validator<Value, Linked, Context>
  | Validator<Value, Linked, Context>[]
  | ValidationConfig<Value, Linked, Context>;

export type NormalizedValidationDictionary<ListItem extends Object> = {
  [Key in keyof ListItem]: NormalizedValidationConfig<ListItem[Key], any, any>
};

export type ValidationDictionary<ListItem extends Object, Linked, Context = ValidationContext<Linked>> = {
  [Key in keyof ListItem]: Validates<ListItem[Key], Linked, Context>
};

export interface FieldState<Value> {
  value: Value;
  defaultValue: Value;
  error: ErrorValue;
  touched: boolean;
  dirty: boolean;
}

export type FieldStates<Record extends Object> = {
  [Key in keyof Record]: FieldState<Record[Key]>
};

export interface Field<Value> {
  value: Value;
  error: ErrorValue;
  defaultValue: Value;
  touched: boolean;
  dirty: boolean;
  onBlur(): void;
  onChange(value: Value | ChangeEvent<HTMLInputElement>): void;
  runValidation(): ErrorValue;
  setError(value: ErrorValue): void;
  newDefaultValue(value: Value): void;
  reset(): void;
}

export type FieldDictionary<Record extends Object> = {
  [Key in keyof Record]: Field<Record[Key]>
};

export interface RemoteError {
  fieldPath?: string[];
  message: string;
}

export type SubmitResult =
  | {
      status: "fail";
      errors: RemoteError[];
    }
  | {
      status: "success";
    };

export type FieldOutput<T> =
  | FieldDictionary<T>
  | Field<T>
  | FieldDictionary<T>[];

export interface FieldBag {
  [key: string]: FieldOutput<any>;
}

export interface SubmitHandler<Fields> {
  (fields: Fields): Promise<SubmitResult>;
}

type FieldValue<T> = T extends Field<any>
  ? T["value"]
  : T extends FieldDictionary<any>
  ? { [InnerKey in keyof T]: T[InnerKey]["value"] }
  : T;

/*
  Represents all of the values mapped out of a mixed dictionary of Field objects,
  nested Field objects, and arrays of nested Field objects
*/
export type FormValues<Bag extends { [key: string]: FieldOutput<any> }> = {
  [Key in keyof Bag]: Bag[Key] extends any[]
    ? { [Index in keyof Bag[Key]]: FieldValue<Bag[Key][Index]> }
    : FieldValue<Bag[Key]>
};
