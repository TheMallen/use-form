import useVisitFields from './visit-fields';
import {FieldBag} from './types';

export default function useReset(fieldBag: FieldBag) {
  return useVisitFields(fieldBag, (field) => field.reset())
}
