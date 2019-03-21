import React, { useReducer, useCallback, useMemo, useEffect } from "react";
import {
  ValidationDictionary,
  NormalizedValidationDictionary,
  FieldStates,
  FieldDictionary,
  FieldState,
  ErrorValue,
} from "./types";
import { mapObject, createValidationConfig, runValidation } from "./utilities";
import { reduceField, initialFieldState, FieldAction, updateErrorAction as updateFieldError } from "./field";

export default function useList<Item, Linked = never>({
  list,
  validates = {},
}: {
  list: Item[];
  validates?: Partial<ValidationDictionary<Item, Linked>>;
}): FieldDictionary<Item>[] {
  const [state, dispatch] = useReducer(
    (state: { list: FieldStates<Item>[] }, action: ListAction<Item>) => {
      switch (action.type) {
        case "reinitialize": {
          return {
            list: action.payload.list.map(initialListItemState),
          };
        }
        case "updateError": {
          const {
            payload: { target, error },
          } = action;
          const { index, key } = target;
          const currentItem = state.list[index];

          currentItem[key] = reduceField(currentItem[key], updateFieldError(error));

          return { ...state };
        }
        case "update":
        case "reset":
        case "newDefaultValue": {
          const {
            payload: { target, value },
          } = action;
          const { index, key } = target;
          const currentItem = state.list[index];

          currentItem[key] = reduceField(currentItem[key], {
            type: action.type,
            payload: value,
          } as FieldAction<typeof value>);

          return { ...state };
        }
      }
    },
    {list: list.map(initialListItemState)}
  );

  useEffect(
    () => {
      dispatch(reinitializeAction(list));
    },
    [list],
  );

  const validationConfigs = useMemo(
    () =>
      mapObject<NormalizedValidationDictionary<any>>(
        validates,
        createValidationConfig,
      ),
    [validates],
  );

  const handlers = state.list.map((item, index) => {
    return mapObject<FieldDictionary<Item>>(
      item,
      <Key extends keyof Item & string>(field: FieldState<Item[Key]>, key: Key) => {
        const target = { index, key };

        return {
          onChange(value: Item[Key]) {
            dispatch(updateAction({target, value}));
          },
          reset(value: Item[Key]) {
            dispatch(resetAction({target, value}));
          },
          newDefaultValue(value: Item[Key]) {
            dispatch(newDefaultAction({target, value}));
          },
          onBlur() {
            const { touched, value } = field;
            const siblings = state.list.filter((listItem) => listItem != item);

            const newError = runValidation(
              { touched, value, siblings, listItem: item },
              validationConfigs[key],
            );

            dispatch(updateErrorAction<Item>({target, error: newError}));
          }
        };
      },
    );
  });

  return state.list.map((item, index) => {
    return mapObject(item, (field, key: keyof Item) => {
      const target = { index, key };
      return {
        ...field,
        ...handlers[index][key],
      };
    });
  });
}

type ListAction<Item> =
  | ReinitializeAction<Item>
  | UpdateErrorAction<Item>
  | UpdateAction<Item, keyof Item>
  | ResetAction<Item, keyof Item>
  | NewDefaultAction<Item, keyof Item>;

interface ReinitializeAction<Item> {
  type: "reinitialize";
  payload: { list: Item[] };
}

interface TargetedPayload<Item, Key extends keyof Item > {
  target: {
    index: number,
    key: Key;
  };
  value: Item[Key];
}

interface UpdateErrorAction<Item> {
  type: "updateError";
  payload: {
    target: {
      index: number,
      key: keyof Item;
    };
    error: ErrorValue;
  };
}

interface ResetAction<Item, Key extends keyof Item> {
  type: "reset";
  payload: TargetedPayload<Item, Key>;
}

interface UpdateAction<Item, Key extends keyof Item> {
  type: "update";
  payload: TargetedPayload<Item, Key>;
}

interface NewDefaultAction<Item, Key extends keyof Item> {
  type: "newDefaultValue";
  payload: TargetedPayload<Item, Key>;
}

function reinitializeAction<Item>(list: Item[]): ReinitializeAction<Item> {
  return {
    type: "reinitialize",
    payload: { list },
  };
}

function updateAction<Item, Key extends keyof Item>(payload: TargetedPayload<Item, Key>): UpdateAction<Item, Key> {
  return {
    type: "update",
    payload,
  };
}

function resetAction<Item, Key extends keyof Item>(payload: TargetedPayload<Item, Key>): ResetAction<Item, Key> {
  return {
    type: "reset",
    payload,
  };
}

function newDefaultAction<Item, Key extends keyof Item>(
  payload: TargetedPayload<Item, Key>
): NewDefaultAction<Item, Key> {
  return {
    type: "newDefaultValue",
    payload,
  };
}

function updateErrorAction<Item>(
  payload: UpdateErrorAction<Item>['payload']
): UpdateErrorAction<Item> {
  return {
    type: "updateError",
    payload,
  };
}

function initialListItemState<Item>(item: Item) {
  return mapObject<FieldStates<Item>>(item, initialFieldState);
}
