import React, { useState, useMemo, useCallback } from "react";
import {
  FieldDictionary,
  FormValues,
  SubmitHandler,
  FieldBag,
  RemoteError,
} from "./types";
import { mapObject, isField } from "./utilities";

export default function useSubmit<T extends FieldBag>(
  onSubmit: SubmitHandler<FormValues<T>>,
  fieldBag: T,
): [() => void, boolean, RemoteError[], (errors: RemoteError[]) => void] {
  const [submitting, setSubmitting] = useState(false);
  const [remoteErrors, setRemoteErrors] = useState([] as RemoteError[]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    const result = await onSubmit(getValues(fieldBag));
    setSubmitting(false);

    if (result.status === "fail") {
      setRemoteErrors(result.errors);
    } else {
      setRemoteErrors([]);
    }
  }, [fieldBag]);

  return [submit, submitting, remoteErrors, setRemoteErrors];
}

function getValues<T extends FieldBag>(fieldBag: T) {
  return mapObject<FormValues<T>>(fieldBag, item => {
    if (isField(item)) {
      return item.value;
    }

    if (Array.isArray(item)) {
      return item.map(valuesOfFields);
    }

    return valuesOfFields(item);
  });
}

function valuesOfFields(fields: FieldDictionary<any>) {
  return mapObject(fields, item => {
    return item.value;
  });
}
