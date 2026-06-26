export class Ok<T> {
  readonly isOk = true as const;
  readonly isFailure = false as const;
  constructor(public readonly value: T) {}
}

export class Err<E> {
  readonly isOk = false as const;
  readonly isFailure = true as const;
  constructor(public readonly error: E) {}
}

export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E>(error: E): Err<E> => new Err(error);
