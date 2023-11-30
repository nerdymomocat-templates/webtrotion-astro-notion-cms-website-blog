import { PUBLISH_ON_FILTER } from "../constants";
import type { PropertyFilterObject, CompoundFilterObject } from "./notion/request-params";

const PUB_FILTER_CONTAINS: PropertyFilterObject = {
  property: "Publish On",
  multi_select: {
    contains: PUBLISH_ON_FILTER,
  },
};

const PUB_FILTER_EMPTY: PropertyFilterObject = {
  property: "Publish On",
  multi_select: {
    is_empty: true
  },
};

export const FOR_THIS_SITE: CompoundFilterObject = {
  or: PUBLISH_ON_FILTER ? [PUB_FILTER_CONTAINS, PUB_FILTER_EMPTY] : [PUB_FILTER_EMPTY]
};
