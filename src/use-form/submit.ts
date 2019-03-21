import React, { useState, useMemo, useCallback } from "react";
import {
  FieldDictionary,
  FormValues,
  SubmitHandler,
  FieldBag
} from "./types";
import { mapObject, isField } from "./utilities";

export default function useSubmit<T extends FieldBag>(
  onSubmit: SubmitHandler<FormValues<T>>,
  fieldBag: T
): [() => void, boolean, string[], (errors: string[]) => void] {
  const values = useMemo(() => {
    return mapObject<FormValues<T>>(fieldBag, item => {
      if (isField(item)) {
        return item.value;
      }

      if (Array.isArray(item)) {
        return item.map(valuesOfFields);
      }

      return valuesOfFields(item);
    });
  }, [Object.values(fieldBag)]);

  const [submitting, setSubmitting] = useState(false);
  const [remoteErrors, setRemoteErrors] = useState([] as string[]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    const result = await onSubmit(values);
    setSubmitting(false);

    if (result.status === "fail") {
      const topLevelErrors = result.errors
        .filter(({ fieldPath }) => fieldPath == null)
        .map(({ message }) => message);
      setRemoteErrors(topLevelErrors);
    } else {
      setRemoteErrors([]);
    }
  }, [values]);

  return [submit, submitting, remoteErrors, setRemoteErrors];
}

function valuesOfFields(fields: FieldDictionary<any>) {
  return mapObject(fields, item => {
    return item.value;
  });
}
