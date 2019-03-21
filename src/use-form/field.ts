import React, {
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { Validates, FieldState, FieldDictionary, Field, ErrorValue } from "./types";
import { createValidationConfig, runValidation } from "./utilities";

interface FieldConfig<Value, Linked> {
  value: Value,
  validates: Validates<Value, Linked>;
}

export default function useField<Value = string, Linked = never>(input: FieldConfig<Value, Linked> | Value): Field<Value> {
  const {value, validates} = normalizeFieldConfig(input);

  const validate = createValidationConfig(validates);

  const [state, dispatch] = useReducer(
    reduceField,
    initialFieldState(value),
  );

  const onChange = useCallback(value => dispatch(updateAction(value)), []);
  const reset = useCallback(() => dispatch(resetAction(value)), []);
  const newDefaultValue = useCallback(
    value => dispatch(newDefaultAction(value)),
    [],
  );

  const onBlur = useCallback(
    () => {
      const { touched, value } = state as FieldState<Value>;
      const error = runValidation<Value, Linked>({ touched, value }, validate as any);
      dispatch(updateErrorAction(error));
    },
    [state.value, state.touched],
  );

  useEffect(onBlur, [validate.with]);

  useEffect(
    () => {
      newDefaultValue(value);
    },
    [value],
  );

  return {
    ...state,
    onBlur,
    onChange,
    newDefaultValue,
    reset,
  } as Field<Value>;
}

function normalizeFieldConfig<Value, Linked>(input: FieldConfig<Value, Linked> | Value): FieldConfig<Value, Linked> {
  if (input == null || typeof input !== 'object') {
    return {value: input, validates: () => undefined};
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
    payload: value,
  };
}

function resetAction<Value>(value: Value): ResetAction<Value> {
  return {
    type: "reset",
    payload: value,
  };
}

function newDefaultAction<Value>(value: Value): NewDefaultAction<Value> {
  return {
    type: "newDefaultValue",
    payload: value,
  };
}

export function updateErrorAction(error: ErrorValue): UpdateErrorAction {
  return {
    type: "updateError",
    payload: error,
  };
}

export type FieldAction<Value> =
  | UpdateErrorAction
  | UpdateAction<Value>
  | ResetAction<Value>
  | NewDefaultAction<Value>;

export function reduceField<Value>(
  state: FieldState<Value>,
  action: FieldAction<Value>,
) {
  switch (action.type) {
    case "update": {
      const newValue = action.payload;
      const { defaultValue } = state;

      return {
        ...state,
        dirty: defaultValue !== newValue,
        value: newValue,
        touched: true,
      };
    }

    case "updateError": {
      return {
        ...state,
        error: action.payload,
      };
    }

    case "reset": {
      const { defaultValue } = state;

      return {
        ...state,
        value: defaultValue,
        dirty: false,
        touched: false,
      };
    }

    case "newDefaultValue": {
      const newDefaultValue = action.payload;
      return {
        ...state,
        value: newDefaultValue,
        defaultValue: newDefaultValue,
        touched: false,
        dirty: false,
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
    dirty: false,
  };
}
