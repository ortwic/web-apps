/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Entity, EntityStatus, EntityValues } from "./entities";
import type { EntityCallbacks } from "./entity_callbacks";
import type { EnumValues, PropertiesOrBuilders } from "./properties";

/**
 * This interface represents a view that includes a collection of entities.
 * It can be in the root level of the configuration, defining the main
 * menu navigation. You can also find it as a subcollection of a different one.
 *
 * @group Models
 */
export interface EntityCollection<M extends Record<string, any> = any> {

    /**
     * You can set an alias that will be used internally instead of the `path`.
     * The `alias` value will be used to determine the URL of the collection,
     * while `path` will still be used in the datasource.
     * Note that you can use this value in reference properties too.
     */
    id: string;

    /**
     * Name of the collection, typically plural.
     * E.g. `Products`, `Blog`
     */
    name: string;

    /**
     * Singular name of an entry in this collection
     * E.g. `Product`, `Blog entry`
     */
    singularName?: string;

    /**
     * Optional description of this view. You can use Markdown.
     */
    description?: string;

    /**
     * Relative path of this view to its parent.
     * If this view is in the root the path is equal to the absolute one.
     * This path also determines the URL in FireCMS, unless an alias is specified
     */
    path: string;

    /**
     * If this collection is a top level navigation entry, you can set this
     * property to `true` to indicate that this collection is a collection group.
     */
    collectionGroup?: boolean;

    /**
     * Icon key to use in this collection.
     * You can use any of the icons in the Material specs:
     * https://fonts.google.com/icons
     * e.g. 'account_tree' or 'person'
     */
    icon?: string;

    /**
     * Optional field used to group top level navigation entries under a~
     * navigation view. If you set this value in a subcollection it has no
     * effect.
     */
    group?: string;

    /**
     * Set of properties that compose an entity
     */
    properties: PropertiesOrBuilders<M>;

    /**
     * Title property of the entity. This is the property that will be used
     * as the title in entity related views and references.
     * If not specified, the first property simple text property will be used.
     */
    titleProperty?: keyof M,

    /**
     * Can this collection be edited by the end user.
     * Defaults to `true`.
     * Keep in mind that you can also set this prop to individual properties.
     */
    editable?: boolean;

    /**
     * Order in which the properties are displayed.
     * If you are specifying your collection as code, the order is the same as the
     * one you define in `properties`. Additional columns are added at the
     * end of the list, if the order is not specified.
     * You can use this prop to hide some properties from the table view.
     * Note that if you set this prop, other ways to hide fields, like
     * `hidden` in the property definition, will be ignored.
     * `propertiesOrder` has precedence over `hidden`.
     *     - For properties use the property key.
     *     - For additional columns use the column id.
     *     - If you have subcollections, you get a column for each subcollection,
     *       with the path (or alias) as the subcollection, prefixed with
     *       `subcollection:`. e.g. `subcollection:orders`.
     *     - If you are using a collection group, you will also have an
     *       additional `collectionGroupParent` column.
     * You can use this prop to hide some properties from the table view.
     * Note that if you set this prop, other ways to hide fields, like
     * `hidden` in the property definition,will be ignored.
     * `propertiesOrder` has precedence over `hidden`.
     */
    propertiesOrder?: Extract<keyof M, string>[];

    /**
     * If enabled, content is loaded in batches. If `false` all entities in the
     * collection are loaded.
     * You can specify a number to specify the pagination size (50 by default)
     * Defaults to `true`
     */
    pagination?: boolean | number;

    /**
     * Flag to indicate if a search bar should be displayed on top of
     * the collection table.
     */
    textSearchEnabled?: boolean;

    /**
     * Permissions the logged-in user can perform on this collection.
     * If not specified everything defaults to `true`.
     */
    // permissions?: Permissions | PermissionsBuilder<EntityCollection, UserType, M>;

    /**
     * Are the entities in this collection selectable. Defaults to `true`
     */
    selectionEnabled?: boolean;

    /**
     * You can add subcollections to your entity in the same way you define the root
     * collections. The collections added here will be displayed when opening
     * the side dialog of an entity.
     */
    subcollections?: EntityCollection<any>[];

    /**
     * This interface defines all the callbacks that can be used when an entity
     * is being created, updated or deleted.
     * Useful for adding your own logic or blocking the execution of the operation.
     */
    callbacks?: EntityCallbacks<M>;

    /**
     * You can define additional actions that can be performed on the entities
     * in this collection. These actions can be displayed in the collection
     * view or in the entity view.
     *
     * You can use the `onClick` method to implement your own logic.
     * In the `context` prop you can access all the controllers of FireCMS.
     *
     * ```
     * const archiveEntityAction: EntityAction = {
     *     icon: <ArchiveIcon/>,
     *     name: "Archive",
     *     onClick({
     *                 entity,
     *                 collection,
     *                 context,
     *             }): Promise<void> {
     *         // Add your code here
     *         return Promise.resolve(undefined);
     *     }
     * }
     * ```
     */
    // entityActions?: EntityAction<M, UserType>[];

    /**
     * Pass your own selection controller if you want to control selected
     * entities externally.
     * @see useSelectionController
     */
    selectionController?: SelectionController<M>;

    /**
     * If this property is not set, the property will be created by the
     * datasource.
     * You can set the value to true to allow the users to choose the ID.
     * You can also pass a set of values (as an EnumValues object) to allow them
     * to pick from only those.
     */
    customId?: boolean | EnumValues | "optional";

    /**
     * Force a filter in this view. If applied, the rest of the filters will
     * be disabled. Filters applied with this prop cannot be changed.
     * e.g. `forceFilter: { age: [">=", 18] }`
     */
    forceFilter?: FilterValues<Extract<keyof M, string>>;

    /**
     * Initial filters applied to the collection this collection is related to.
     * Defaults to none. Filters applied with this prop can be changed.
     * e.g. `initialFilter: { age: [">=", 18] }`
     */
    initialFilter?: FilterValues<Extract<keyof M, string>>; // setting FilterValues<M> can break defining collections by code

    /**
     * Default sort applied to this collection.
     * When setting this prop, entities will have a default order
     * applied in the collection.
     * e.g. `initialSort: ["order", "asc"]`
     */
    initialSort?: [Extract<keyof M, string>, "asc" | "desc"];

    /**
     * Array of builders for rendering additional panels in an entity view.
     * Useful if you need to render custom views.
     * You can either define the custom view inline or pass a reference to
     * a custom view defined in the main configuration under `entityViews`
     */
    entityViews?: (string | EntityCustomView)[];

    /**
     * You can add additional fields to the collection view by implementing
     * an additional field delegate.
     */
    additionalFields?: AdditionalFieldDelegate<M>[];

    /**
     * Default size of the rendered collection
     */
    defaultSize?: CollectionSize;

    /**
     * Can the elements in this collection be edited inline in the collection
     * view. If this flag is set to false but `permissions.edit` is `true`, entities
     * can still be edited in the side panel
     */
    inlineEditing?: boolean;

    /**
     * Should this collection be hidden from the main navigation panel, if
     * it is at the root level, or in the entity side panel if it's a
     * subcollection.
     * It will still be accessible if you reach the specified path.
     * You can also use this collection as a reference target.
     */
    hideFromNavigation?: boolean;

    /**
     * If you want to open custom views or subcollections by default when opening the edit
     * view of an entity, you can specify the path to the view here.
     * The path is relative to the current collection. For example if you have a collection
     * that has a custom view as well as a subcollection that refers to another entity, you can
     * either specify the path to the custom view or the path to the subcollection.
     */
    defaultSelectedView?: string | DefaultSelectedViewBuilder;

    /**
     * Should the ID of this collection be hidden from the form view.
     */
    hideIdFromForm?: boolean;

    /**
     * Should the ID of this collection be hidden from the grid view.
     */
    hideIdFromCollection?: boolean;

    /**
     * If set to true, the form will be auto-saved when the user changes
     * the value of a field.
     * Defaults to false.
     * You can't use this prop if you are using a `customId`
     */
    formAutoSave?: boolean;

    /**
     *
     */
    exportable?: boolean;

    /**
     * User id of the owner of this collection. This is used only by plugins, or if you
     * are writing custom code
     */
    ownerId?: string;

    /**
     * Width of the side dialog (in pixels) when opening an entity in this collection.
     */
    sideDialogWidth?: number | string;
}

/**
 * Use this controller to retrieve the selected entities or modify them in
 * an {@link EntityCollection}
 * If you want to pass a `SelectionController` to
 * @group Models
 */
export type SelectionController<M extends Record<string, any> = any> = {
    selectedEntities: Entity<M>[];
    // setSelectedEntities: Dispatch<SetStateAction<Entity<M>[]>>;
    isEntitySelected: (entity: Entity<M>) => boolean;
    toggleEntitySelection: (entity: Entity<M>) => void;
}

/**
 * Filter conditions in a `Query.where()` clause are specified using the
 * strings `<`, `<=`, `==`, `>=`, `>`, `array-contains`, `in`, and `array-contains-any`.
 * @group Models
 */
export type WhereFilterOp =
    | "<"
    | "<="
    | "=="
    | "!="
    | ">="
    | ">"
    | "array-contains"
    | "in"
    | "not-in"
    | "array-contains-any";

/**
 * Used to define filters applied in collections
 *
 * e.g. `{ age: [">=", 18] }`
 *
 * @group Models
 */
export type FilterValues<Key extends string> =
    Partial<Record<Key, [WhereFilterOp, any]>>;

/**
 * Used to indicate valid filter combinations (e.g. created in Firestore)
 * If the user selects a specific filter/sort combination, the CMS checks if it's
 * valid, otherwise it reverts to the simpler valid case
 * @group Models
 */
export type FilterCombination<Key extends string> = Partial<Record<Key, "asc" | "desc">>;

/**
 * Sizes in which a collection can be rendered
 * @group Models
 */
export type CollectionSize = "xs" | "s" | "m" | "l" | "xl";

/**
 * Use this interface for adding additional fields to entity collection views.
 * If you need to do some async loading you can use {@link AsyncPreviewComponent}
 * @group Models
 */
export interface AdditionalFieldDelegate<M extends Record<string, any> = any> {

    /**
     * ID of this column. You can use this id in the `properties` field of the
     * collection in any order you want
     */
    key: string;

    /**
     * Header of this column
     */
    name: string;

    /**
     * Width of the generated column in pixels
     */
    width?: number;

    /**
     * If this column needs to update dynamically based on other properties,
     * you can define an array of keys as strings with the
     * `dependencies` prop.
     * e.g. ["name", "surname"]
     * This is a performance optimization, if you don't define dependencies
     * it will be updated in every render.
     */
    dependencies?: Extract<keyof M, string>[];

    /**
     * Use this prop to define the value of the column as a string or number.
     * This is the value that will be used for exporting the collection.
     * If `Builder` is defined, this prop will be ignored in the collection
     * view.
     * @param entity
     */
    value?: (props: { 
        entity: Entity<M>, 
        // context: FireCMSContext<any> 
    }) => string | number | Promise<string | number> | undefined;
}

/**
 * You can use this builder to render a custom panel in the entity detail view.
 * It gets rendered as a tab.
 * @group Models
 */
export type EntityCustomView =
    {
        key: string,
        name: string,
    }

/**
 * Parameters passed to the builder in charge of rendering a custom panel for
 * an entity view.
 * @group Models
 */
export interface EntityCustomViewParams<M extends Record<string, any> = any> {

    /**
     * collection used by this entity
     */
    collection: EntityCollection<M>;

    /**
     * Entity that this view refers to. It can be undefined if the entity is new
     */
    entity?: Entity<M>;

    /**
     * Modified values in the form that have not been saved yet.
     * If the entity is not new and the values are not modified, these values
     * are the same as in `entity`
     */
    modifiedValues?: EntityValues<M>;

    /**
     * Use the form context to access the form state and methods
     */
    // formContext: FormContext;
}

export type InferCollectionType<S extends EntityCollection> = S extends EntityCollection<infer M> ? M : never;

/**
 * Used in the {@link EntityCollection#defaultSelectedView} to define the default
 * @group Models
 */
export type DefaultSelectedViewBuilder = (params: DefaultSelectedViewParams) => string | undefined;

/**
 * Used in the {@link EntityCollection#defaultSelectedView} to define the default
 * @group Models
 */
export type DefaultSelectedViewParams = {
    status?: EntityStatus;
    entityId?: string;
};
/**
 * You can use this controller to control the table view of a collection.
 */
export type EntityTableController<M extends Record<string, any> = any> = {
    data: Entity<M>[];
    dataLoading: boolean;
    noMoreToLoad: boolean;
    dataLoadingError?: Error;
    filterValues?: FilterValues<Extract<keyof M, string>>;
    setFilterValues?: (filterValues: FilterValues<Extract<keyof M, string>>) => void;
    sortBy?: [Extract<keyof M, string>, "asc" | "desc"];
    setSortBy?: (sortBy?: [Extract<keyof M, string>, "asc" | "desc"]) => void;
    searchString?: string;
    setSearchString?: (searchString?: string) => void;
    clearFilter?: () => void;
    itemCount?: number;
    setItemCount?: (itemCount: number) => void;
    paginationEnabled?: boolean;
    pageSize?: number;
    checkFilterCombination?: (filterValues: FilterValues<any>,
                              sortBy?: [string, "asc" | "desc"]) => boolean;
    popupCell?: SelectedCellProps<M>;
    setPopupCell?: (popupCell?: SelectedCellProps<M>) => void;

    onAddColumn?: (column: string) => void;
}

export type SelectedCellProps<M extends Record<string, any>> = {
    propertyKey: Extract<keyof M, string>;
    cellRect: DOMRect;
    width: number;
    height: number;
    entity: Entity<M>;
};
