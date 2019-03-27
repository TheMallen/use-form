import React, { useEffect } from "react";
import get from "get-value";

import { FieldOutput, FormError } from "./types";
import { isField } from "./utilities";

export default function useErrorPropagation(
  fieldBag: { [key: string]: FieldOutput<unknown> },
  remoteErrors: FormError[]
) {
  useEffect(() => {
    remoteErrors
      .forEach(error => {
        if (error.fieldPath == null) {
          return;
        }

        // the library can actually accept arrays but the typings are wrong
        const got = get(fieldBag, error.fieldPath as any);

        if (isField(got)) {
          got.setError(error.message);
        }
      });
  }, [remoteErrors]);
}
