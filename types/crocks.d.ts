declare module 'crocks/Async' {
  import type { F } from 'ts-toolbelt'

  type AsyncCallback<L, R> = (
    reject: (data: L) => void,
    resolve: (data: R) => void,
  ) => (() => void) | undefined

  interface AsyncStatic {
    <L, R>(cb: AsyncCallback<L, R>): Async<L, R>
    of: <R>(data: R) => Async<never, R>
    Rejected: <L>(data: L) => Async<L, never>
    Resolved: <R>(data: R) => Async<never, R>

    fromPromise: <R, A extends unknown[]>(
      f: (...args: A) => Promise<R>,
    ) => (...args: A) => Async<unknown, R>

    fromNode: <L, R, A extends unknown[]>(
      f: (...args: [...A, (err: L, result: R) => unknown]) => unknown,
    ) => (...args: A) => Async<L, R>

    all: <T extends readonly Async<unknown, unknown>[] | []>(
      values: T,
    ) => Async<
      { [P in keyof T]: AsyncLeft<T[P]> }[number],
      { [P in keyof T]: AsyncRight<T[P]> }
    >

    resolveAfter: <R>(after: number, data: R) => Async<never, R>
    rejectAfter: <L>(after: number, data: L) => Async<L, never>
  }

  type AsyncLeft<T> = T extends Async<infer L, unknown> ? L : never
  type AsyncRight<T> = T extends Async<unknown, infer R> ? R : never

  type ParametersTail<T> = T extends (
    head: unknown,
    ...tail: infer A
  ) => unknown
    ? A
    : never

  type CurriedReturnType<T> =
    T extends F.Curry<(...args: unknown[]) => infer R1>
      ? R1
      : T extends (...args: unknown[]) => infer R2
        ? R2
        : never

  interface Async<L, R> {
    fork(
      left: (data: L) => void,
      right: (data: R) => void,
      cancel?: () => void,
    ): () => void

    map<R2>(mapper: (data: R) => R2): Async<L, R2>

    bimap<L2, R2>(left: (data: L) => L2, right: (data: R) => R2): Async<L2, R2>

    chain<L2, R2>(chainer: (data: R) => Async<L2, R2>): Async<L | L2, R2>

    bichain<LL, LR, RL, RR>(
      left: (data: L) => Async<LL, LR>,
      right: (data: R) => Async<RL, RR>,
    ): Async<LL | RL, LR | RR>

    coalesce<L2, R2>(
      left: (data: L) => L2,
      right: (data: R) => R2,
    ): Async<never, L2 | R2>

    swap<L2, R2>(left: (data: L) => L2, right: (data: R) => R2): Async<R2, L2>

    alt<L2, R2>(a: Async<L2, R2>): Async<L2, R | R2>

    ap<L2>(
      a: Async<L2, R extends (x: infer P) => unknown ? P : never>,
    ): Async<
      L | L2,
      ParametersTail<R> extends []
        ? CurriedReturnType<R>
        : F.Curry<(...args: ParametersTail<R>) => CurriedReturnType<R>>
    >

    race<L2, R2>(a: Async<L2, R2>): Async<L | L2, R | R2>
    toPromise(): Promise<R>
  }

  const Async: AsyncStatic
  export default Async
}
