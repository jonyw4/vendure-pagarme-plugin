export type Unarray<T> = T extends (infer U)[] ? U : T;

/**
 * Optional
 * @desc From `T` make a set of properties by key `K` become optional
 * @example
 *    type Props = {
 *      name: string;
 *      age: number;
 *      visible: boolean;
 *    };
 *
 *    // Expect: { name?: string; age?: number; visible?: boolean; }
 *    type Props = Optional<Props>;
 *
 *    // Expect: { name: string; age?: number; visible?: boolean; }
 *    type Props = Optional<Props, 'age' | 'visible'>;
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type Optional<T extends object, K extends keyof T = keyof T> = Omit<
  T,
  K
> &
  Partial<Pick<T, K>>;
