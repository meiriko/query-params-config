import { useMemo } from "react";
import {
  useQueryParams,
  ArrayParam,
  QueryParamConfig,
  DecodedValueMap,
  encodeDelimitedArray,
  decodeDelimitedArray,
} from "use-query-params";

type ExcludeNullable<T> = Exclude<T, undefined | null>;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type ParamType<T extends QueryParamConfig<any>> = T extends QueryParamConfig<
  infer I
>
  ? ExcludeNullable<I> extends (infer II)[]
    ? ExcludeNullable<II>
    : ExcludeNullable<I>
  : never;

type UpdateFN<T> = (value: T) => T;

type IsArrayParam<T extends QueryParamConfig<any>> = T extends QueryParamConfig<
  infer D1
>
  ? ExcludeNullable<D1> extends unknown[]
    ? true
    : false
  : false;

export type ParamHelpers<T extends QueryParamConfig<any>> =
  IsArrayParam<T> extends true
    ? {
        [P in "set" | "add" | "remove" | "toggle"]: P extends "set"
          ? (value?: ParamType<T>[]) => void
          : (value?: ParamType<T>) => void;
      }
    : ParamType<T> extends boolean
    ? {
        [P in "set" | "toggle"]: P extends "set"
          ? (value?: boolean) => void
          : () => void;
      }
    : {
        set: (value?: ParamType<T>) => void;
      };

export type InitTypes<T extends Record<string, QueryParamConfig<any>>> =
  Partial<{
    [K in keyof T]: IsArrayParam<T[K]> extends true
      ? ParamType<T[K]>[]
      : ParamType<T[K]>;
  }>;

type FlatHelpers<T extends Record<string, QueryParamConfig<any>>> =
  UnionToIntersection<
    {
      [K in keyof T]: {
        [M in keyof ParamHelpers<T[K]> as `${string & M}${Capitalize<
          string & K
        >}`]: ParamHelpers<T[K]>[M];
      };
    }[keyof T]
  >;

type ParamsHelpers<T extends Record<string, QueryParamConfig<any>>> = {
  [K in keyof T]: ParamHelpers<T[K]>;
} & FlatHelpers<T> & { clear: (keys?: string[]) => void };

type AnyHelper = ParamHelpers<QueryParamConfig<any>>;

export const BooleanParam: QueryParamConfig<boolean | undefined> = {
  encode(value: boolean | undefined) {
    return value ? "true" : "false";
  },

  decode(strValue: string | (string | null)[] | null | undefined) {
    return strValue?.toString() === "true"
      ? true
      : strValue
      ? false
      : undefined;
  },
};

export function toTypedArrayParam<T extends string>(delimiter = "_") {
  return {
    isArray: true,
    encode: (array: (T | null)[] | null | undefined) =>
      encodeDelimitedArray(array, delimiter),

    decode: (arrayStr: string | (string | null)[] | null | undefined) =>
      decodeDelimitedArray(arrayStr, delimiter) as (T | null)[],
  };
}

export function useQueryParamHelpers<T extends Record<string, any>>(
  config: T,
  prefix?: string,
  init?: InitTypes<T>
) {
  const removePrefix = useMemo(() => {
    if (prefix) {
      const removePrefixRE = new RegExp(`^${prefix}\\.`);
      return (key: string) => key.replace(removePrefixRE, "");
    } else {
      return (key: string) => key;
    }
  }, [prefix]);

  const configWithPrefix = useMemo(() => {
    if (prefix) {
      return Object.fromEntries(
        Object.entries(config).map(([key, value]) => [
          `${prefix}.${key}`,
          value,
        ])
      );
    } else {
      return config;
    }
  }, [config, prefix]);

  const [query, setQuery] = useQueryParams(configWithPrefix);
  const helpers = useMemo(() => {
    const helpersEntries = Object.keys(configWithPrefix).map((key) => {
      if (
        configWithPrefix[key] === ArrayParam ||
        (configWithPrefix[key] as any)?.["isArray"]
      ) {
        const helpers = {
          set: (value?: unknown[] | UpdateFN<unknown[]>) => {
            setQuery((prevQuery) => {
              if (typeof value === "function") {
                return { [key]: value(prevQuery?.[key]) } as Partial<
                  DecodedValueMap<T>
                >;
              } else {
                return {
                  [key]: value?.length
                    ? Array.from(new Set(value)).sort()
                    : undefined,
                };
              }
            });
          },
          add: (value: unknown) =>
            setQuery((prevQuery) => {
              const oldValue = (prevQuery?.[key] ?? []) as unknown[];
              if (oldValue === configWithPrefix[key]?.default) {
                return { [key]: [value] } as Partial<DecodedValueMap<T>>;
              } else if (oldValue.includes(value)) {
                return prevQuery;
              } else {
                return { [key]: [...oldValue, value].sort() } as Partial<
                  DecodedValueMap<T>
                >;
              }
            }),
          remove: (value: unknown) =>
            setQuery((prevQuery) => {
              if (!prevQuery?.[key]?.includes(value)) {
                return prevQuery;
              }
              const newValue = prevQuery[key].filter(
                (item: unknown) => item !== value
              );
              return {
                [key]: newValue?.length ? newValue : undefined,
              } as Partial<DecodedValueMap<T>>;
            }),
          toggle: (value: unknown) =>
            setQuery((prevQuery) => {
              const oldValue = (prevQuery?.[key] ?? []) as unknown[];
              if (oldValue === configWithPrefix[key]?.default) {
                return { [key]: [value] } as Partial<DecodedValueMap<T>>;
              } else if (oldValue?.includes(value)) {
                return {
                  [key]:
                    oldValue.length > 1
                      ? oldValue.filter((item: unknown) => item !== value)
                      : undefined,
                } as Partial<DecodedValueMap<T>>;
              } else {
                return { [key]: [...oldValue, value].sort() } as Partial<
                  DecodedValueMap<T>
                >;
              }
            }),
        };
        return [removePrefix(key), helpers];
      } else if (
        configWithPrefix[key] === BooleanParam ||
        typeof configWithPrefix[key].default === "boolean"
      ) {
        return [
          removePrefix(key),
          {
            set: (value?: boolean | UpdateFN<boolean>) => {
              setQuery((prevQuery) => {
                if (typeof value === "function") {
                  return { [key]: value(prevQuery?.[key]) } as Partial<
                    DecodedValueMap<T>
                  >;
                } else {
                  return { [key]: value } as Partial<DecodedValueMap<T>>;
                }
              });
            },
            toggle: () =>
              setQuery(
                (prevQuery) =>
                  ({ [key]: !prevQuery?.[key] } as Partial<DecodedValueMap<T>>)
              ),
          },
        ];
      } else {
        return [
          removePrefix(key),
          {
            set: (value?: unknown | UpdateFN<unknown>) => {
              setQuery((prevQuery) => {
                if (typeof value === "function") {
                  return { [key]: value(prevQuery?.[key]) };
                } else {
                  return { [key]: value };
                }
              });
            },
          },
        ];
      }
    }) as [string, AnyHelper][];
    const clear = (keys?: string[]) => {
      const emptyQuery = Object.fromEntries(
        Object.keys(configWithPrefix)
          .filter((key) =>
            keys?.length ? keys.includes(removePrefix(key)) : true
          )
          .map((key) => [key, configWithPrefix[key].default])
      );
      setQuery(emptyQuery as Partial<DecodedValueMap<T>>);
    };
    const explicitHelpersEntries = helpersEntries
      .map(([key, helpers]) => {
        const capitzlizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        const explicitHelpers = Object.entries(helpers).map(([fnKey, fn]) => [
          `${fnKey}${capitzlizedKey}`,
          fn,
        ]);
        return explicitHelpers as [string, AnyHelper][];
      })
      .flat();
    const helpersWithExplicityEntries = helpersEntries.concat(
      explicitHelpersEntries
    );
    const helpers = Object.fromEntries([
      ...helpersWithExplicityEntries,
      ["clear", clear],
    ]) as ParamsHelpers<T>;
    if (init) {
      setTimeout(() => {
        Object.entries(init)
          .filter(([, value]) => value !== undefined)
          .forEach(([key, value]) => {
            const setFN = helpers[key].set as (value: unknown) => unknown;
            setFN((prev: unknown) => {
              return prev || value;
            });
          });
      }, 0);
    }
    return helpers;
  }, [setQuery, configWithPrefix, removePrefix, init]);
  const queryWithoutPrefix = useMemo(() => {
    return Object.fromEntries(
      Object.entries(query).map(([key, value]) => [removePrefix(key), value])
    );
  }, [query, removePrefix]);
  // const harmonizedQuery = useMemo(() => {
  //   const encodedQuery = encodeQueryParams(
  //     config,
  //     queryWithoutPrefix as Partial<DecodedValueMap<T>>
  //   );
  //   const sortedEncodedQuery = Object.fromEntries(
  //     Object.entries(encodedQuery).sort(([a], [b]) => a.localeCompare(b))
  //   );
  //   return objectToSearchString(sortedEncodedQuery);
  // }, [queryWithoutPrefix, config]);

  return { query: queryWithoutPrefix, setQuery, helpers };
}
