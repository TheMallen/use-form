import React, { useCallback } from "react";
import { FieldDictionary, FieldOutput } from "./types";
import { isField } from './utilities';

export default function useReset(fieldBag: { [key: string]: FieldOutput<unknown> }) {
  const reset = useCallback(() => {
    const fields = Object.values(fieldBag);
    
    for (const item of fields) {
      if (isField(item)) {
        item.reset();
        continue;
      }

      if (Array.isArray(item)) {
        item.forEach(resetFields);
        continue;
      }

      resetFields(item);
    }
  }, [fieldBag]);

  return reset;
}

function resetFields(fields: FieldDictionary<any>) {
  return Object.keys(fields).forEach(key => {
    const field = fields[key];
    field.reset();
  });
}
