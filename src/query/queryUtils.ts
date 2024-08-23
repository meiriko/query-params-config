import { useCallback, useMemo, useState } from "react";
import {
  useQueryParams,
  ArrayParam,
  QueryParamConfig,
  DecodedValueMap,
  encodeDelimitedArray,
  decodeDelimitedArray,
} from "use-query-params";
import { pickBy, mapValues, mapKeys } from "lodash";

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
    // if (this.default !== undefined) {
    if ((value ?? this.default) === this.default) {
      return undefined;
    }
    // }

    return value ?? this.default ? "true" : "false";
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

function useHelpers<T extends Record<string, any>>(
  prefixedConfig: T,
  setQuery: (prev: Record<string, any>) => any,
  removePrefix: (key: string) => string,
  init?: Record<string, any>
) {
  return useMemo(() => {
    const helpersEntries = Object.keys(prefixedConfig).map((key) => {
      if (
        prefixedConfig[key] === ArrayParam ||
        (prefixedConfig[key] as any)?.["isArray"]
      ) {
        const helpers = {
          set: (value?: unknown[] | UpdateFN<unknown[]>) => {
            setQuery((prevQuery: Pick<T, typeof key>) => {
              if (typeof value === "function") {
                return { [key]: value(prevQuery?.[key]) };
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
            setQuery((prevQuery: Pick<T, typeof key>) => {
              const oldValue = (prevQuery?.[key] ?? []) as unknown[];
              if (oldValue === prefixedConfig[key]?.default) {
                return { [key]: [value] } as Partial<DecodedValueMap<T>>;
              } else if (oldValue.includes(value)) {
                return prevQuery;
              } else {
                return { [key]: [...oldValue, value].sort() };
              }
            }),
          remove: (value: unknown) =>
            setQuery((prevQuery: Pick<T, typeof key>) => {
              if (!prevQuery?.[key]?.includes(value)) {
                return prevQuery;
              }
              const newValue = prevQuery[key].filter(
                (item: unknown) => item !== value
              );
              return {
                [key]: newValue?.length ? newValue : undefined,
              };
            }),
          toggle: (value: unknown) =>
            setQuery((prevQuery: Pick<T, typeof key>) => {
              const oldValue = (prevQuery?.[key] ?? []) as unknown[];
              if (oldValue === prefixedConfig[key]?.default) {
                return { [key]: [value] };
              } else if (oldValue?.includes(value)) {
                return {
                  [key]:
                    oldValue.length > 1
                      ? oldValue.filter((item: unknown) => item !== value)
                      : undefined,
                };
              } else {
                return { [key]: [...oldValue, value].sort() };
              }
            }),
        };
        return [removePrefix(key), helpers];
      } else if (
        prefixedConfig[key] === BooleanParam ||
        typeof prefixedConfig[key].default === "boolean"
      ) {
        return [
          removePrefix(key),
          {
            set: (value?: boolean | UpdateFN<boolean>) => {
              setQuery((prevQuery: Pick<T, typeof key>) => {
                if (typeof value === "function") {
                  return { [key]: value(prevQuery?.[key]) };
                } else {
                  return { [key]: value };
                }
              });
            },
            toggle: () =>
              setQuery((prevQuery: Pick<T, typeof key>) => ({
                [key]: !prevQuery?.[key],
              })),
          },
        ];
      } else {
        return [
          removePrefix(key),
          {
            set: (value?: unknown | UpdateFN<unknown>) => {
              setQuery((prevQuery: Pick<T, typeof key>) => {
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
      const emptyQuery = mapValues(
        pickBy(prefixedConfig, (_value, key) =>
          keys?.length ? keys.includes(removePrefix(key)) : true
        ),
        (_value, key) => prefixedConfig[key].default
      );
      setQuery(emptyQuery);
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
  }, [setQuery, prefixedConfig, removePrefix, init]);
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

  const prefixedConfig = useMemo(() => {
    if (prefix) {
      return mapKeys(config, (_value, key) => `${prefix}.${key}`);
    } else {
      return config;
    }
  }, [config, prefix]);

  const [query, setQuery] = useQueryParams(prefixedConfig);
  const helpers = useHelpers(
    prefixedConfig,
    setQuery,
    removePrefix,
    init
  ) as ParamsHelpers<T>;
  const queryWithoutPrefix = useMemo(() => {
    return prefix ? mapKeys(query, (_value, key) => removePrefix(key)) : query;
  }, [query, removePrefix, prefix]);
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

  return { query: queryWithoutPrefix, rq: query, setQuery, helpers };
}

function getInit(
  config: Record<string, QueryParamConfig<any>>,
  init?: Record<string, any>
) {
  return mapValues(config, (value, key) => init?.[key] || value.default);
}

const selfMapper = (key: string) => key;

function withoutDefaults(
  query: Record<string, any>,
  config: Record<string, QueryParamConfig<any>>
) {
  return mapValues(query, (value, key) =>
    value !== config[key].default ? value : undefined
  );
}

export function useDeferredQueryParamHelpers<T extends Record<string, any>>(
  config: T,
  prefix?: string,
  init?: InitTypes<T>
) {
  const [query, setQueryBase] = useState(getInit(config, init));
  const prefixedConfig = useMemo(() => {
    return prefix
      ? mapKeys(config, (_value, key) => `${prefix}.${key}`)
      : config;
  }, [config, prefix]);
  const [, setQueryRaw] = useQueryParams(prefixedConfig);
  const setQuery = useCallback(
    (
      update:
        | Record<string, any>
        | ((prev: Record<string, any>) => Record<string, any>)
    ) => {
      setQueryBase((prev) => {
        return {
          ...prev,
          ...(typeof update === "function" ? update(prev) : update),
        };
      });
    },
    [setQueryBase]
  );
  const helpers = useHelpers(
    config,
    setQuery,
    selfMapper,
    init
  ) as ParamsHelpers<T>;
  const applyQuery = useCallback(() => {
    setQueryBase((query) => {
      const queryWithoutDefaults = withoutDefaults(query, config);
      const result = prefix
        ? mapKeys(queryWithoutDefaults, (_value, key) => `${prefix}.${key}`)
        : queryWithoutDefaults;
      setQueryRaw(result);
      return query;
    });
  }, [config, setQueryRaw, prefix]);

  return {
    query,
    setQuery,
    applyQuery,
    helpers,
  };
}
