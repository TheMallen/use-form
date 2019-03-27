import React, { useReducer, useMemo, useEffect } from "react";
import {
  ValidationDictionary,
  NormalizedValidationDictionary,
  NormalizedValidationConfig,
  FieldStates,
  FieldDictionary,
  FieldState,
  ErrorValue
} from "./types";
import { mapObject, createValidationConfig } from "./utilities";
import {
  reduceField,
  initialFieldState,
  FieldAction,
  updateErrorAction as updateFieldError
} from "./field";

export interface ListValidationContext<Linked, Item> {
  linked: Linked;
  listItem: FieldStates<Item>;
  siblings: FieldStates<Item>[];
}

export default function useList<Item, Linked = never>({
  list,
  validates
}: {
  list: Item[];
  validates?: Partial<
    ValidationDictionary<Item, Linked, ListValidationContext<Linked, Item>>
  >;
}): FieldDictionary<Item>[] {
  const [state, dispatch] = useReducer(
    (state: { list: FieldStates<Item>[] }, action: ListAction<Item>) => {
      switch (action.type) {
        case "reinitialize": {
          return {
            list: action.payload.list.map(initialListItemState)
          };
        }
        case "updateError": {
          const {
            payload: { target, error }
          } = action;
          const { index, key } = target;
          const currentItem = state.list[index];

          currentItem[key] = reduceField(
            currentItem[key],
            updateFieldError(error)
          );

          return { ...state };
        }
        case "reset": {
          const {
            payload: { target }
          } = action;
          const { index, key } = target;
          const currentItem = state.list[index];

          currentItem[key] = reduceField(currentItem[key], { type: "reset" });

          return { ...state };
        }
        case "update":
        case "newDefaultValue": {
          const {
            payload: { target, value }
          } = action;
          const { index, key } = target;
          const currentItem = state.list[index];

          currentItem[key] = reduceField(currentItem[key], {
            type: action.type,
            payload: value
          } as FieldAction<typeof value>);

          return { ...state };
        }
      }
    },
    { list: list.map(initialListItemState) }
  );

  useEffect(() => {
    dispatch(reinitializeAction(list));
  }, [list]);

  const validationConfigs = useMemo(
    () =>
      mapObject<NormalizedValidationDictionary<any>>(
        validates,
        createValidationConfig
      ),
    [validates]
  );

  const handlers = state.list.map((item, index) => {
    return mapObject<FieldDictionary<Item>>(
      item,
      <Key extends keyof Item & string>(
        field: FieldState<Item[Key]>,
        key: Key
      ) => {
        const target = { index, key };

        function validate() {
          const validates = validationConfigs[key];

          if (validates == null) {
            return;
          }

          const siblings = state.list.filter(listItem => listItem != item);

          runValidation(
            error => dispatch(updateErrorAction<Item>({ target, error })),
            { value: field.value, siblings, listItem: item },
            validates
          );
        }

        return {
          onChange(value: Item[Key]) {
            dispatch(updateAction({ target, value }));
          },
          reset() {
            dispatch(resetAction({ target }));
          },
          newDefaultValue(value: Item[Key]) {
            dispatch(newDefaultAction({ target, value }));
          },
          runValidation: validate,
          onBlur() {
            const { touched, error } = field;

            if (touched === false && error == null) {
              return;
            }

            validate();
          }
        };
      }
    );
  });

  return state.list.map((item, index) => {
    return mapObject(item, (field, key: keyof Item) => {
      return {
        ...field,
        ...handlers[index][key]
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

interface TargetedPayload<Item, Key extends keyof Item> {
  target: {
    index: number;
    key: Key;
  };
  value: Item[Key];
}

interface UpdateErrorAction<Item> {
  type: "updateError";
  payload: {
    target: {
      index: number;
      key: keyof Item;
    };
    error: ErrorValue;
  };
}

interface ResetAction<Item, Key extends keyof Item> {
  type: "reset";
  payload: {
    target: {
      index: number;
      key: Key;
    };
  };
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
    payload: { list }
  };
}

function updateAction<Item, Key extends keyof Item>(
  payload: TargetedPayload<Item, Key>
): UpdateAction<Item, Key> {
  return {
    type: "update",
    payload
  };
}

function resetAction<Item, Key extends keyof Item>(
  payload: ResetAction<Item, Key>['payload']
): ResetAction<Item, Key> {
  return {
    type: "reset",
    payload
  };
}

function newDefaultAction<Item, Key extends keyof Item>(
  payload: TargetedPayload<Item, Key>
): NewDefaultAction<Item, Key> {
  return {
    type: "newDefaultValue",
    payload
  };
}

function updateErrorAction<Item>(
  payload: UpdateErrorAction<Item>["payload"]
): UpdateErrorAction<Item> {
  return {
    type: "updateError",
    payload
  };
}

function initialListItemState<Item>(item: Item) {
  return mapObject<FieldStates<Item>>(item, initialFieldState);
}

function runValidation<Value, Linked, Record>(
  updateError: (error: ErrorValue) => void,
  state: {
    value: Value;
    listItem: FieldStates<Record>;
    siblings: FieldStates<Record>[];
  },
  validate: NormalizedValidationConfig<
    Value,
    Linked,
    ListValidationContext<Linked, Record>
  >
) {
  const { value, listItem, siblings } = state;

  const error = validate.using
    .map(check =>
      check(value as Value, {
        linked: validate.with as Linked,
        listItem,
        siblings
      })
    )
    .filter(value => value != null);

  if (error && error.length > 0) {
    const [firstError] = error;
    updateError(firstError);
    return firstError;
  }

  updateError(undefined);
}
