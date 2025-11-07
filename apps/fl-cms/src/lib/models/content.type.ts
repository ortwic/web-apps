import type { Entity } from "./schema.model";

export type ContentDocument = Entity & { content: TypedValue[] };
export type TypedValue = {
    value: string | object;
    type: string;
};

  export type UpdatePropertyArgs<T = unknown> = {
      field: string;
      value: T;
  };