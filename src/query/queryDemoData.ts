import {
  ArrayParam,
  BooleanParam,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { toTypedArrayParam } from "./queryUtils";

type PAT =
  | "ACTIVE"
  | "INACTIVE"
  | "MERGED"
  | "NOT_MERGED"
  | "HAS_RECIPE"
  | "NO_RECIPE"
  | "COMPONENT_OF"
  | "NOT_COMPONENT_OF"
  | "VISIBLE"
  | "NOT_VISIBLE"
  | "FRACTIONAL"
  | "NOT_FRACTIONAL";

type RATING = "HORRIBLE" | "BAD" | "OK" | "GOOD" | "GREAT";

const coords = ["x", "yy", "zzz"];
const pats: PAT[] = [
  "ACTIVE",
  "INACTIVE",
  "MERGED",
  "NOT_MERGED",
  "HAS_RECIPE",
  "NO_RECIPE",
  "COMPONENT_OF",
  "NOT_COMPONENT_OF",
  "VISIBLE",
  "NOT_VISIBLE",
  "FRACTIONAL",
  "NOT_FRACTIONAL",
];
const ratings: RATING[] = ["HORRIBLE", "BAD", "OK", "GOOD", "GREAT"];

const CommaArrayParam = toTypedArrayParam<PAT>("__");
const RatingArrayPram = withDefault(toTypedArrayParam<RATING>("__"), [
  "GREAT",
  "HORRIBLE",
]);

const BooleanWithDefault = withDefault(BooleanParam, false);

export const bigConfig = {
  x: NumberParam,
  name: StringParam,
  coords: ArrayParam,
  active: BooleanWithDefault,
  pat: CommaArrayParam,
  rating: RatingArrayPram,
};

export const partialOnBigConfig = {
  name: StringParam,
  active: BooleanWithDefault,
};

export const bigConfigValues = {
  pat: pats,
  rating: ratings,
  coords,
};

export const otherConfig = {
  count: NumberParam,
  completed: BooleanWithDefault,
  active: BooleanWithDefault,
};
