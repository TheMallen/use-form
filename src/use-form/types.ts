export type ErrorValue = string | undefined;

export interface Validator<Value, Linked, Record = any> {
  (value: Value, context: ValidationContext<Linked, Record>): ErrorValue;
}

export interface ValidationContext<Linked, Record = any> {
  linked: Linked;
  siblings: FieldStates<Record>[];
  listItem: FieldStates<Record>;
}

export interface NormalizedValidationConfig<Value, Linked> {
  using: Validator<Value, Linked>[];
  with?: Linked;
}

export interface ValidationConfig<Value, Linked> {
  using: Validator<Value, Linked> | Validator<Value, Linked>[];
  with?: Linked;
}

export type Validates<Value, Linked> =
  | Validator<Value, Linked>
  | Validator<Value, Linked>[]
  | ValidationConfig<Value, Linked>;

export type NormalizedValidationDictionary<ListItem extends Object> = {
  [Key in keyof ListItem]: NormalizedValidationConfig<ListItem[Key], any>
};

export type ValidationDictionary<ListItem extends Object, Linked> = {
  [Key in keyof ListItem]: Validates<ListItem[Key], Linked>
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
  onChange(value: Value): void;
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
