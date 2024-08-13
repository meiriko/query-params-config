import {
  ArrayParam,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { BooleanParam, InitTypes, toTypedArrayParam } from "./queryUtils";

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
const BooleanWithDefaultTrue = withDefault(BooleanParam, true);

export const bigConfig = {
  ticks: NumberParam,
  x: NumberParam,
  name: StringParam,
  miroName: withDefault(StringParam, "miro"),
  coords: ArrayParam,
  active: BooleanWithDefault,
  trueByDefault: BooleanWithDefaultTrue,
  justBool: BooleanParam,
  pat: CommaArrayParam,
  rating: RatingArrayPram,
};

export const bigInit: InitTypes<typeof bigConfig> = {
  x: 33,
  name: "n-i",
  pat: ["ACTIVE", "INACTIVE"],
};

export const partialOnBigConfig = {
  ticks: NumberParam,
  name: StringParam,
  active: BooleanWithDefault,
  count: NumberParam,
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
