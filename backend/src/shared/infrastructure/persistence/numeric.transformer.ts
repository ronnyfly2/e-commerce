import { ValueTransformer } from 'typeorm';

/** pg returns `decimal`/`numeric` columns as strings to avoid precision loss; coordinates need real numbers. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? value : parseFloat(value)),
};
