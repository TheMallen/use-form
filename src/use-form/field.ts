import React, { useReducer, useCallback, useEffect } from "react";
import { Validates, FieldState, Field, ErrorValue } from "./types";
import { createValidationConfig, isChangeEvent } from "./utilities";

interface FieldConfig<Value, Linked> {
  value: Value;
  validates: Validates<Value, Linked>;
}

export default function useField<Value = string, Linked = never>(
  input: FieldConfig<Value, Linked> | Value
): Field<Value> {
  const { value, validates } = normalizeFieldConfig(input);
  const validate = createValidationConfig(validates);

  const [state, dispatch] = useReducer(reduceField, initialFieldState(value));

  const reset = useCallback(() => dispatch(resetAction(value)), []);
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
      return error[0];
    }
  }, [state.value]);

  const onBlur = useCallback(() => {
    if (state.touched === false) {
      return;
    }

    const error = runValidation();

    dispatch(updateErrorAction(error));
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

interface ResetAction<Value> {
  type: "reset";
  payload: Value;
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

function resetAction<Value>(value: Value): ResetAction<Value> {
  return {
    type: "reset",
    payload: value
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
  | UpdateAction<Value>
  | ResetAction<Value>
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
