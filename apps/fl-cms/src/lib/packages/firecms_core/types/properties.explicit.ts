/**
 * Required as hook for ts-json-schema-generator only
 */
export type PropertyRecord = Record<string, Property>;

/**
 * Base property shared by all types
 */
export interface BaseProperty {
  /** Datatype of the property */
  dataType: "string" | "number" | "boolean" | "date" | "array" | "map";

  /** Property name */
  name?: string;

  /** Short description displayed under the field */
  description?: string;

  /** Longer description displayed in popover */
  longDescription?: string;

  /** Width of the column in the collection view */
  columnWidth?: number;

  /** Visibility flags */
  hideFromCollection?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  editable?: boolean;

  /** Validation rules */
  validation?: PropertyValidation;

  /** Default value */
  defaultValue?: any;
}

/**
 * Validation rules for any property
 */
export interface PropertyValidation {
  required?: boolean;
  requiredMessage?: string;
  unique?: boolean;
  uniqueInArray?: boolean;
}

/**
 * String property
 */
export interface StringProperty extends BaseProperty {
  dataType: "string";
  multiline?: boolean;
  markdown?: boolean;
  enumValues?: EnumValues;
  storage?: StorageConfig;
  url?: boolean | PreviewType;
  email?: boolean;
  previewAsTag?: boolean;
  clearable?: boolean;
}

/**
 * Number property
 */
export interface NumberProperty extends BaseProperty {
  dataType: "number";
  enumValues?: EnumValues;
  clearable?: boolean;
}

/**
 * Boolean property
 */
export interface BooleanProperty extends BaseProperty {
  dataType: "boolean";
}

/**
 * Date property
 */
export interface DateProperty extends BaseProperty {
  dataType: "date";
  mode?: "date" | "date_time";
  autoValue?: "on_create" | "on_update";
  clearable?: boolean;
}

/**
 * Array property
 */
export interface ArrayProperty extends BaseProperty {
  dataType: "array";
  of?: Property; // nested property type
  oneOf?: {
    properties: Record<string, Property>;
    propertiesOrder?: string[];
    typeField?: string;
    valueField?: string;
  };
  expanded?: boolean;
}

/**
 * Map property
 */
export interface MapProperty extends BaseProperty {
  dataType: "map";
  properties?: Record<string, Property>;
  propertiesOrder?: string[];
  previewProperties?: string[];
  pickOnlySomeKeys?: boolean;
  spreadChildren?: boolean;
  expanded?: boolean;
  keyValue?: boolean;
}

/**
 * Union type for all properties
 */
export type Property =
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | DateProperty
  | ArrayProperty
  | MapProperty;

/**
 * Enum values support
 */
export type EnumValueConfig = {
  id: string | number;
  label: string;
  disabled?: boolean;
};

export type EnumValues =
  | EnumValueConfig[]
  | Record<string | number, string | EnumValueConfig>;

/**
 * Storage config
 */
export type StorageConfig = {
  acceptedFiles?: string[];
  metadata?: Record<string, unknown>;
  fileName?: string;
  storagePath: string;
  storeUrl?: boolean;
  maxSize?: number;
};

/**
 * Preview types
 */
export type PreviewType = "image" | "video" | "audio" | "file";
