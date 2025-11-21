/**
 * Required as hook for ts-json-schema-generator only
 */
export type PropertyRecord = Record<string, Property>;

/**
 * @group Entity properties
 */
export type DataType<T extends CMSType = CMSType> =
    T extends string ? "string" :
        T extends number ? "number" :
            T extends boolean ? "boolean" :
                T extends Date ? "date" :
                    T extends Array<CMSType> ? "array" :
                        T extends Record<string, any> ? "map" : never;

/**
 * @group Entity properties
 */
export type CMSType =
    | string
    | number
    | boolean
    | Date
    | Record<string, any>
    | CMSType[];

/**
 * @ignore
 */
export type AnyProperty =
    StringProperty |
    NumberProperty |
    BooleanProperty |
    DateProperty |
    ArrayProperty |
    MapProperty;

/**
 * @group Entity properties
 */
export type Property<T extends CMSType = CMSType> =
    T extends string ? StringProperty :
        T extends number ? NumberProperty :
            T extends boolean ? BooleanProperty :
                T extends Date ? DateProperty :
                    T extends Array<CMSType> ? ArrayProperty<T> :
                        T extends Record<string, any> ? MapProperty<T> : AnyProperty;

/**
 * Interface including all common properties of a CMS property
 * @group Entity properties
 */
export interface BaseProperty<T extends CMSType> {

    /**
     * Datatype of the property
     */
    dataType: DataType;

    /**
     * Property name (e.g. Product)
     */
    name?: string;

    /**
     * Property description, always displayed under the field
     */
    description?: string;

    /**
     * You can use this prop to reuse a property that has been defined
     * in the top level of the CMS in the prop `fields`.
     * All the configuration will be taken from the inherited config, and
     * overwritten by the current property config.
     */
    propertyConfig?: string;

    /**
     * Longer description of a field, displayed under a popover
     */
    longDescription?: string;

    /**
     * Width in pixels of this column in the collection view. If not set
     * the width is inferred based on the other configurations
     */
    columnWidth?: number;

    /**
     * Do not show this property in the collection view
     */
    hideFromCollection?: boolean;

    /**
     * Is this a read only property. When set to true, it gets rendered as a
     * preview.
     */
    readOnly?: boolean;

    /**
     * Is this field disabled.
     * When set to true, it gets rendered as a
     * disabled field. You can also specify a configuration for defining the
     * behaviour of disabled properties (including custom messages, clear value on
     * disabled or hide the field completely)
     */
    disabled?: boolean;
    
    /**
     * Rules for validating this property
     */
    validation?: PropertyValidationSchema;

    /**
     * This value will be set by default for new entities.
     */
    defaultValue?: T;

    /**
     * Should this property be editable. If set to true, the user will be able to modify the property and
     * save the new config. The saved config will then become the source of truth.
     */
    editable?: boolean;
}

/**
 * @group Entity properties
 */
export type EnumType = number | string;

/**
 * We use this type to define mapping between string or number values in
 * the data source to a label (such in a select dropdown).
 * The key in this Record is the value saved in the datasource, and the value in
 * this record is the label displayed in the UI.
 * You can add additional customization by assigning a {@link EnumValueConfig} for the
 * label instead of a simple string (for enabling or disabling options and
 * choosing colors).
 * If you need to ensure the order of the elements use an array of {@link EnumValueConfig}
 * @group Entity properties
 */
export type EnumValues = EnumValueConfig[]
    | Record<string | number, string | EnumValueConfig>;

/**
 * Configuration for a particular entry in an `EnumValues`
 * @group Entity properties
 */
export type EnumValueConfig = {
    /**
     * Value stored in the data source.
     */
    id: string | number;
    /**
     * Displayed label
     */
    label: string;
    /**
     * This value will not be selectable
     */
    disabled?: boolean;
}

/**
 * Record of properties of an entity or a map property
 * @group Entity properties
 */
export type Properties<M extends Record<string, any> = any> = {
    [k in keyof M]: Property<M[keyof M]>;
};

/**
 * @group Entity properties
 */
export interface NumberProperty extends BaseProperty<number> {

    dataType: "number";

    /**
     * You can use the enum values providing a map of possible
     * exclusive values the property can take, mapped to the label that it is
     * displayed in the dropdown.
     */
    enumValues?: EnumValues;

    /**
     * Add an icon to clear the value and set it to `null`. Defaults to `false`
     */
    clearable?: boolean;
}

/**
 * @group Entity properties
 */
export interface BooleanProperty extends BaseProperty<boolean> {

    dataType: "boolean";

}

/**
 * @group Entity properties
 */
export interface StringProperty extends BaseProperty<string> {

    dataType: "string";

    /**
     * Is this string property long enough so it should be displayed in
     * a multiple line field. Defaults to false. If set to true,
     * the number of lines adapts to the content
     */
    multiline?: boolean;

    /**
     * Should this string property be displayed as a markdown field. If true,
     * the field is rendered as a text editors that supports markdown highlight
     * syntax. It also includes a preview of the result.
     */
    markdown?: boolean;

    /**
     * You can use the enum values providing a map of possible
     * exclusive values the property can take, mapped to the label that it is
     * displayed in the dropdown. You can use a simple object with the format
     * `value` => `label`, or with the format `value` => `EnumValueConfig` if you
     * need extra customization, (like disabling specific options or assigning
     * colors). If you need to ensure the order of the elements, you can pass
     * a `Map` instead of a plain object.
     *
     */
    enumValues?: EnumValues;

    /**
     * You can specify a `Storage` configuration. It is used to
     * indicate that this string refers to a path in Google Cloud Storage.
     */
    storage?: StorageConfig;

    /**
     * If the value of this property is a URL, you can set this flag to true
     * to add a link, or one of the supported media types to render a preview
     */
    url?: boolean | PreviewType;

    /**
     * Does this field include an email
     */
    email?: boolean;

    /**
     * Should this string be rendered as a tag instead of just text.
     */
    previewAsTag?: boolean;

    /**
     * Add an icon to clear the value and set it to `null`. Defaults to `false`
     */
    clearable?: boolean;
}

/**
 * @group Entity properties
 */
export interface ArrayProperty<T extends ArrayT[] = any[], ArrayT extends CMSType = CMSType> extends BaseProperty<T> {

    dataType: "array";

    /**
     * The property of this array.
     * You can specify any property (except another Array property)
     * You can leave this field empty only if you are providing a custom field,
     * or using the `oneOf` prop, otherwise an error will be thrown.
     */
    of?: Property<ArrayT>;

    /**
     * Use this field if you would like to have an array of typed objects.
     * It is useful if you need to have values of different types in the same
     * array.
     * Each entry of the array is an object with the shape:
     * ```
     * { type: "YOUR_TYPE", value: "YOUR_VALUE"}
     * ```
     * Note that you can use any property so `value` can take any value (strings,
     * numbers, array, objects...)
     * You can customise the `type` and `value` fields to suit your needs.
     *
     * An example use case for this feature may be a blog entry, where you have
     * images and text blocks using markdown.
     */
    oneOf?: {
        /**
         * Record of properties, where the key is the `type` and the value
         * is the corresponding property
         */
        properties: Properties;

        /**
         * Order in which the properties are displayed.
         * If you are specifying your collection as code, the order is the same as the
         * one you define in `properties`, and you don't need to specify this prop.
         */
        propertiesOrder?: string[];

        /**
         * Name of the field to use as the discriminator for type
         * Defaults to `type`
         */
        typeField?: string;

        /**
         * Name of the  field to use as the value
         * Defaults to `value`
         */
        valueField?: string;
    };

    /**
     * Should the field be initially expanded. Defaults to `true`
     */
    expanded?: boolean;

}

/**
 * @group Entity properties
 */
export interface MapProperty<T extends Record<string, CMSType> = Record<string, CMSType>> extends BaseProperty<T> {

    dataType: "map";

    /**
     * Record of properties included in this map.
     */
    properties?: Properties<T>;

    /**
     * Order in which the properties are displayed.
     * If you are specifying your collection as code, the order is the same as the
     * one you define in `properties`, and you don't need to specify this prop.
     */
    propertiesOrder?: Extract<keyof T, string>[];

    /**
     * Properties that are displayed when rendered as a preview
     */
    previewProperties?: Partial<Extract<keyof T, string>>[];

    /**
     * Allow the user to add only some keys in this map.
     * By default, all properties of the map have the corresponding field in
     * the form view. Setting this flag to true allows to pick only some.
     * Useful for map that can have a lot of sub-properties that may not be
     * needed
     */
    pickOnlySomeKeys?: boolean;

    /**
     * Display the child properties as independent columns in the collection
     * view
     */
    spreadChildren?: boolean;

    /**
     * Should the field be initially expanded. Defaults to `true`
     */
    expanded?: boolean;

    /**
     * Render this map as a key-value table that allows to use
     * arbitrary keys. You don't need to define the properties in this case.
     */
    keyValue?: boolean;

}

/**
 * @group Entity properties
 */
export interface DateProperty extends BaseProperty<Date> {

    dataType: "date";

    /**
     * Set the granularity of the field to a date or date + time.
     * Defaults to `date_time`.
     *
     */
    mode?: "date" | "date_time";

    /**
     * If this flag is  set to `on_create` or `on_update` this timestamp is
     * updated automatically on creation of the entity only or on every
     * update (including creation). Useful for creating `created_on` or
     * `updated_on` fields
     */
    autoValue?: "on_create" | "on_update"

    /**
     * Add an icon to clear the value and set it to `null`. Defaults to `false`
     */
    clearable?: boolean;
}

/**
 * Rules to validate any property. Some properties have specific rules
 * additionally to these.
 * @group Entity properties
 */
export interface PropertyValidationSchema {
    /**
     * Is this field required
     */
    required?: boolean;

    /**
     * Customize the required message when the property is not set
     */
    requiredMessage?: string;

    /**
     * If the unique flag is set to `true`, you can only have one entity in the
     * collection with this value.
     */
    unique?: boolean;

    /**
     * If the uniqueInArray flag is set to `true`, you can only have this value
     * once per entry in the parent `ArrayProperty`. It has no effect if this
     * property is not a child of an `ArrayProperty`. It works on direct
     * children of an `ArrayProperty` or first level children of `MapProperty`
     */
    uniqueInArray?: boolean;
}

/**
 * Additional configuration related to Storage related fields
 * @group Entity properties
 */
export type StorageConfig = {

    /**
     * File MIME types that can be uploaded to this reference. Don't specify for
     * all.
     * Note that you can also use the asterisk notation, so `image/*`
     * accepts any image file, and so on.
     */
    acceptedFiles?: FileType[];

    /**
     * Specific metadata set in your uploaded file.
     * For the default Firebase implementation, the values passed here are of type
     * `firebase.storage.UploadMetadata`
     */
    metadata?: Record<string, unknown>,

    /**
     * You can use this prop to customize the uploaded filename.
     * You can use a function as a callback or a string where you
     * specify some placeholders that get replaced with the corresponding values.
     * - {file} - Full file name
     * - {file.name} - Name of the file without extension
     * - {file.ext} - Extension of the file
     * - {rand} - Random value used to avoid name collisions
     * - {entityId} - ID of the entity
     * - {propertyKey} - ID of this property
     * - {path} - Path of this entity
     *
     * @param context
     */
    fileName?: string;

    /**
     * Absolute path in your bucket.
     *
     * You can use a function as a callback or a string where you
     * specify some placeholders that get replaced with the corresponding values.
     * - {file} - Full file name
     * - {file.name} - Name of the file without extension
     * - {file.ext} - Extension of the file
     * - {rand} - Random value used to avoid name collisions
     * - {entityId} - ID of the entity
     * - {propertyKey} - ID of this property
     * - {path} - Path of this entity
     */
    storagePath: string;

    /**
     * When set to true, this flag indicates that the download URL of the file
     * will be saved in the datasource, instead of the storage path.
     *
     * Note that the generated URL may use a token that, if disabled, may
     * make the URL unusable and lose the original reference to Cloud Storage,
     * so it is not encouraged to use this flag.
     *
     * Defaults to false.
     */
    storeUrl?: boolean,

    /**
     * Define maximal file size in bytes
     */
    maxSize?: number,

}

/**
 * Used for previewing urls if the download file is known
 * @group Entity properties
 */
export type PreviewType = "image" | "video" | "audio" | "file";

/**
 * MIME types for storage fields
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
 * @group Entity properties
 */
export type FileType =
    "image/*"
    | "video/*"
    | "audio/*"
    | "application/*"
    | "text/*"
    | "font/*"
    | string;

