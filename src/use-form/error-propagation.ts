import React, { useEffect } from "react";
import get from "get-value";

import { FieldOutput, RemoteError } from "./types";
import { isField } from "./utilities";

export default function useErrorPropagation(
  fieldBag: { [key: string]: FieldOutput<unknown> },
  remoteErrors: RemoteError[]
) {
  useEffect(() => {
    remoteErrors
      .forEach(error => {
        console.log(error);
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
