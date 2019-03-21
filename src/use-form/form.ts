import useDirty from "./dirty";
import useReset from "./reset";
import useSubmit from "./submit";
import {SubmitHandler, FormValues, FieldBag} from './types';

export default function useForm<T extends FieldBag>({fields, onSubmit}: {
  fields: T,
  onSubmit: SubmitHandler<FormValues<T>>,
}) {
  const dirty = useDirty(fields);
  const reset = useReset(fields);
  const [submit, submitting, remoteErrors, setRemoteErrors] = useSubmit(onSubmit, fields);

  return {
    fields,
    dirty,
    submitting,
    remoteErrors,
    submit,
    reset: () => {
      setRemoteErrors([]);
      reset();
    },
  }
}
