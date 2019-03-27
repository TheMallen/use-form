import React, { useReducer, useCallback, useEffect } from "react";
import { Validates, FieldState, Field, ErrorValue } from "./types";
import { createValidationConfig, isChangeEvent } from "./utilities";

interface FieldConfig<Value, Linked> {
  value: Value;
  validates: Validates<Value, Linked>;
}

/**
 * A custom hook for handling the state and validations of an input field.
 *
 * In it's simplest form `useField` can be called with a single parameter for the default value of the field.
 *
 * ```typescript
   const field = useField('default title');
   ```
 *
 * You can also pass a more complex configuration object specifying a validation function.
 *
 *
 * ```typescript
  const field = useField({
    value: someRemoteData.title,
    validates: (title) => {
      if (title.length > 3) {
        return 'Title must be longer than three characters';
      }
    }
  });
 ```
 *
 * In the most complex cases, validations can express dependencies on other
 * values using `validates.with`, and include an arbitrary number of validators.
 *
 *```typescript
   const field = useField({
     value: someRemoteData.title,
     validates: {
       using: [
        (title) => {
           if (title.length > 3) {
             return 'Title must be longer than three characters';
           }
        },
        (title, {linked}) => {
           // linked here will contain whatever value we've passed to `validates.with`
           if (!title.includes(linked)) {
             return `Title must include ${linked}`
           }
         }
       ],
       // with can be any value and the type will be propagated to all validators for this field
       with: keyword
     },
   });
 * ```
 *
 * @param config - The default value of the input, or a configuration object of the form `{value: V, validates: ValidationConfig}`
 * @returns A `Field` object representing the current state and imperative methods for your input
 *
 * ```typescript
  const title = useField('default title');
  const {
    value, // the current value of the field
    error, // the current error message for the field
    defaultValue, // the default value of the field
    touched, // whether the input has been interacted with
    dirty, // whether the value is equal to the default
    onBlur, // the callback for when the user blurs the field
    onChange, // the callback for when the user edits the field
    runValidation, // runs the validators of the field and updates `error`
    setError, // sets `error`
    newDefaultValue, // reinitializes the field with a new `defaultValue`
    reset, // sets `value` to `defaultValue` and clears `dirty` and `touched`
  } = title;
  ```
 *
 * The returned field object represents the state of your input
 * and includes functions to manipulate that state. Generally, you will want to pass
 * these callbacks down to the component or components representing your input.
 *
 * ```typescript
  const title = useField('default title');
  return (
    <div>
      <label for="title">Title</label>
      <input
        id="title"
        name="title"
        value={title.value}
        onChange={title.onChange}
        onBlur={title.onBlur}
      />
      {title.error && <p className="error">{title.error}</p>}
    </div>
  );
  ```
 * If using `@shopify/polaris` or other custom components that support
 * passing `onChange`, `onBlur`, `value`, and `error` props then
 * you can accomplish the above more tersely by using the ES6 `spread` (...) operator.
 *
  ```typescript
  const title = useField('default title');
  return (<TextField label="Title" {...title} />);
  ```
 *
 * @remarks If the `value` property of the field configuration changes between calls to `useField`,
 * the field will be reset to use it as it's new default value.
 */
export default function useField<Value = string, Linked = never>(
  input: FieldConfig<Value, Linked> | Value
): Field<Value> {
  const { value, validates } = normalizeFieldConfig(input);
  const validate = createValidationConfig(validates);
  const [state, dispatch] = useReducer(reduceField, initialFieldState(value));

  const reset = useCallback(() => dispatch(resetAction()), []);
  const newDefaultValue = useCallback(
    value => dispatch(newDefaultAction(value)),
    []
  );
  const onChange = useCallback((value: any) => {
    if (isChangeEvent(value)) {
      dispatch(updateAction(value.target.value));
      return;
    }
    dispatch(updateAction(value));
  }, []);
  const setError = useCallback(value => dispatch(updateErrorAction(value)), []);

  const runValidation = useCallback(() => {
    const { value } = state;

    const error = validate.using
      .map(check => check(value as Value, { linked: validate.with as Linked }))
      .filter(value => value != null);

    if (error && error.length > 0) {
      const [firstError] = error;
      dispatch(updateErrorAction(firstError));
      return firstError;
    }

    dispatch(updateErrorAction(undefined))
  }, [state.value]);

  const onBlur = useCallback(() => {
    const {touched, error} = state;
    if (touched === false && error == null) {
      return;
    }

    runValidation();
  }, [runValidation, state.touched]);

  useEffect(onBlur, [validate.with]);

  // We want to reset the form whenever a new `value` is passed in
  useEffect(() => {
    newDefaultValue(value);
  }, [value]);

  return {
    ...state,
    onBlur,
    onChange,
    newDefaultValue,
    runValidation,
    setError,
    reset
  } as Field<Value>;
}

function normalizeFieldConfig<Value, Linked>(
  input: FieldConfig<Value, Linked> | Value
): FieldConfig<Value, Linked> {
  if (input == null || typeof input !== "object") {
    return { value: input, validates: () => undefined };
  }

  return input as FieldConfig<Value, Linked>;
}

interface UpdateErrorAction {
  type: "updateError";
  payload: ErrorValue;
}

interface ResetAction {
  type: "reset";
}

interface UpdateAction<Value> {
  type: "update";
  payload: Value;
}

interface NewDefaultAction<Value> {
  type: "newDefaultValue";
  payload: Value;
}

function updateAction<Value>(value: Value): UpdateAction<Value> {
  return {
    type: "update",
    payload: value
  };
}

function resetAction(): ResetAction {
  return {
    type: "reset",
  };
}

function newDefaultAction<Value>(value: Value): NewDefaultAction<Value> {
  return {
    type: "newDefaultValue",
    payload: value
  };
}

export function updateErrorAction(error: ErrorValue): UpdateErrorAction {
  return {
    type: "updateError",
    payload: error
  };
}

export type FieldAction<Value> =
  | UpdateErrorAction
  | ResetAction
  | UpdateAction<Value>
  | NewDefaultAction<Value>;

export function reduceField<Value>(
  state: FieldState<Value>,
  action: FieldAction<Value>
) {
  switch (action.type) {
    case "update": {
      const newValue = action.payload;
      const { defaultValue } = state;

      return {
        ...state,
        dirty: defaultValue !== newValue,
        value: newValue,
        touched: true
      };
    }

    case "updateError": {
      return {
        ...state,
        error: action.payload
      };
    }

    case "reset": {
      const { defaultValue } = state;

      return {
        ...state,
        error: undefined,
        value: defaultValue,
        dirty: false,
        touched: false
      };
    }

    case "newDefaultValue": {
      const newDefaultValue = action.payload;
      return {
        ...state,
        value: newDefaultValue,
        defaultValue: newDefaultValue,
        touched: false,
        dirty: false
      };
    }
  }
}

export function initialFieldState<Value>(value: Value): FieldState<Value> {
  return {
    value,
    defaultValue: value,
    error: undefined,
    touched: false,
    dirty: false
  };
}
