<script lang="ts">
  import 'tabulator-tables/dist/css/tabulator_bulma.min.css';
  import { 
    type Filter, 
    type GroupArg,
    type GroupComponent, 
    type Options, 
    Tabulator, 
    ClipboardModule,
    DownloadModule,
    EditModule, 
    ExportModule,
    FilterModule, 
    FormatModule, 
    GroupRowsModule, 
    HistoryModule,
    HtmlTableImportModule,
    KeybindingsModule,
    MenuModule, 
    MoveColumnsModule,
    PersistenceModule,
    PrintModule,
    ResizeColumnsModule, 
    ResizeRowsModule,
    ResizeTableModule,
    SelectRowModule,
    SortModule, 
    ValidateModule
  } from 'tabulator-tables';
  import * as luxon from 'luxon';
  import type { ColumnDefinition } from './tabulator/types.js';
  import { default as ResponsiveLayoutModule, type CollapsedCellData } from './tabulator/modules/ResponsiveLayout.js';
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { Readable } from 'svelte/store';
  import { Observable, fromEvent, map, take } from 'rxjs';
  import { orientation, type Orientation } from './stores/media.store.js';
  import { tableView, type TableView } from './stores/table-view.store.js';
  import responsiveCollapse from './tabulator/modules/formatters/responsiveCollapse.js';

  window['luxon'] = luxon;

  Tabulator.registerModule([
    ClipboardModule,
    DownloadModule,
    EditModule,
    ExportModule,
    FilterModule,
    FormatModule,
    GroupRowsModule,
    HistoryModule,
    HtmlTableImportModule,
    KeybindingsModule,
    MenuModule,
    MoveColumnsModule,
    PersistenceModule,
    PrintModule,
    ResizeColumnsModule,
    ResizeRowsModule,
    ResizeTableModule,
    ResponsiveLayoutModule,
    SelectRowModule,
    SortModule,
    ValidateModule
  ]);

  Tabulator.extendModule('format', 'formatters', {
    responsiveCollapse
  });

  type T = $$Generic<object>;
  type GroupFormatter = (value: unknown, count: number, data: T[], group?: GroupComponent) => string;
  type DetailFormatter = (data: CollapsedCellData[]) => HTMLElement;

  const rowGroups: Record<string, GroupArg> = {};
  export let idField: keyof T;
  export let columns: ColumnDefinition[] = [];
  export let data: Readable<T[]> | Observable<T[]>;
  export let groupBy: string[] | undefined = undefined;
  export let placeholder = '';
  export let placeholderSearch = '';
  export let groupHeader: GroupFormatter | undefined = undefined;
  export let detailFormatter: DetailFormatter | undefined = undefined;
  export const isGroupedBy = (field: string) => field in rowGroups;
  export let options = {} as Options;
  export let persistenceID = '';
  export let enableResponsiveLayoutSupport = false;
  let useResponsiveLayout = false;
  let searchTerm = '';
  let table: Observable<Tabulator>;
  let tableContainer: HTMLElement;
  let endOrientation = () => {};

  const dispatch = createEventDispatcher<{ init: TableView }>();
  const groupContextMenu = [
    {
      label: 'Open all', // TODO not working
      action() {
        $table.getGroups().forEach(g => {
          console.log(g.getKey(), g.getField())
          g.show()
        });
      }
    },
    {
      label: 'Collapse all', // TODO not working
      action() {
        $table.getGroups().forEach(g => g.hide());
      }
    }
  ];
  
  const usePersistance = !!persistenceID;
  const defaultOptions: Options = {
    columns,
    placeholder,
    clipboard: true,
    movableColumns: true,
    groupBy,
    groupContextMenu,
    groupHeader,
    groupStartOpen: [true, (v, n) => (n < 3)], 
    groupToggleElement: 'header',
    groupUpdateOnCellEdit: true,
    footerElement: '#footer',
    history: true,
    reactiveData: true,
    responsiveLayoutCollapseStartOpen: false,
    responsiveLayoutCollapseFormatter: detailFormatter,
    pagination: false,
    persistenceID,
    persistenceMode: 'local',
    persistenceWriterFunc(id, type, data) {
      if (type === 'group') {
        data = { 
          // Issue #41: workaround for inability to persist custom groupBy functions
          groupBy: Object.keys(rowGroups) 
        };
      } 
      localStorage.setItem(id + "-" + type, JSON.stringify(data));
    },
  };

  onMount(() => endOrientation = orientation.subscribe(createTable));
  onDestroy(() => {
    $table?.destroy();
    endOrientation();
  });

  function createTable(orientation: Orientation) {
    $table?.destroy();

    useResponsiveLayout = enableResponsiveLayoutSupport && orientation === 'portrait';
    const persistence = {
        columns: usePersistance && !useResponsiveLayout ? [ 'width', 'visible' ] : false,
        sort: usePersistance,
        headerFilter: usePersistance && !useResponsiveLayout,
        filter: usePersistance && useResponsiveLayout,
        group: usePersistance
    };

    const tableInstance = new Tabulator(tableContainer, {
      ...defaultOptions,
      layout: useResponsiveLayout ? 'fitDataStretch' : 'fitData',
      headerVisible: !useResponsiveLayout,
      responsiveLayout: useResponsiveLayout ? 'collapse' : undefined,
      persistence,
      ...options
    });
    table = fromEvent(tableInstance, 'tableBuilt').pipe(take(1), map(() => handleTableBuilt(tableInstance, useResponsiveLayout)));
  }

  function handleTableBuilt(table: Tabulator, useResponsiveLayout: boolean) {
    initGroupBy(table);
    if (useResponsiveLayout) {
      initSearch(table);
    }

    const view = { 
      table,
      columns,
      useResponsiveLayout,
      groups: Object.keys(rowGroups),
      toggleGroup
    };
    tableView.set(view);
    dispatch('init', view);
    return table;
  }

  function initGroupBy(table: Tabulator) {
    if (Array.isArray(table.options.groupBy)) {
      table.options.groupBy.forEach(field => {
        if (typeof field === 'string') {
          rowGroups[field] = <GroupArg>columns.find(c => c.field === field)?.groupByFunc;
          table.getColumn(field)?.getElement()?.classList.add('primary');
        }
      });
      setGroupBy(table);
    }
  }

  function initSearch(table: Tabulator) {
    const array = table.getFilters(false)[0] as unknown as Filter[];
    searchTerm = array?.filter(f => f.value)[0]?.value;
  }

  function toggleGroup(field: string, element?: HTMLElement) {
    if (!isGroupedBy(field)) {
      rowGroups[field] = <GroupArg>columns.find(c => c.field === field)?.groupByFunc;
      element?.classList.add('primary');
    } else {
      delete rowGroups[field];
      element?.classList.remove('primary');
    }
    setGroupBy($table);
  }

  function setGroupBy(table: Tabulator) {
    const groups = Object.keys(rowGroups).map(k => rowGroups[k] ?? k);
    table.setGroupBy(<GroupArg>(groups.length ? groups as string[] : undefined));
  }

  function search() {
    if (searchTerm) {
      $table.clearHeaderFilter();

      // 2nd level array enforces OR comparison
      $table.setFilter([columns
        .filter(c => c.sorter === 'string')
        .map(c => ({ field: c.field, type: 'like', value: searchTerm }))
      ]);
    } else {
      $table.clearFilter(false);
    }
  }

  $: setData($table, $data);

  async function setData(table: Tabulator, data: T[]): Promise<void> {
    const areEquivalent = (source: T[]) => {
        if (source.length !== data.length) return false;
        // Better performance with Set instead indexOf
        const newIds = new Set(data.map((v: T) => v[idField]));
        return source.every(item => newIds.has(item[idField]));
    };
  
    const isAppendOnly = (source: T[]) => {
        const existingIds = new Set(source.map(item => item[idField]));
        const newIds = data.map((v: T) => v[idField]);
        return data.length > source.length 
            && [...existingIds].every(id => newIds.indexOf(id) > -1);
    };

    if (table && data) {
        if (data.length && idField && areEquivalent(table.getData())) {
            await table.updateData(data);
            console.debug('upd', data.length);
        } else if (data.length && idField && isAppendOnly(table.getData())) {
            const existingIds = new Set(table.getData().map(item => item[idField]));
            const newRows = data.filter(item => !existingIds.has(item[idField]));
            await table.addData(newRows);
            console.debug('add', newRows.length);
        } else {
            await table.setData(data);
            console.debug('set', data.length);
        }
    }
  }
</script>

<span class="menu {useResponsiveLayout ? 'responsive' : 'static'}">
  <div class="section">
    <input type="search" placeholder={placeholderSearch} autocomplete="off" bind:value={searchTerm} on:input={search}/>
  </div>
</span>

<div id="table" bind:this={tableContainer}>
</div>
<span id="footer">
  <slot name="footer"></slot>
</span>

<style lang="scss">
  .menu {
    &.static {
      display: none;
    }

    &.responsive {
      display: inline;
    }

    .section {
      display: flex;

      input[type=search] {
        width: 100%;
      }
    }
  }

  #table {
    overflow: auto;
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
  }

  #footer {
    width: 100%;
  }
</style>
  