<script lang="ts">
    import 'tabulator-tables/dist/css/tabulator_bulma.min.css';
    import '$styles/tabulator.css';
    import { 
        type ColumnComponent, 
        type ColumnDefinition,
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
        SortModule, 
        ValidateModule,
    } from 'tabulator-tables';
    import * as luxon from 'luxon';
    import { Observable, fromEvent, map, take } from 'rxjs';
    import { onMount } from 'svelte';
    import type { Readable } from 'svelte/store';
    import { toggleVisibilityItem } from './menu.helper';

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
        SortModule,
        ValidateModule
    ]);

    let table: Observable<Tabulator>;
    let tableContainer: HTMLElement;
  
    type T = $$Generic<{}>;
    export let idField: keyof T;
    export let data: Readable<T[]>;
    export let columns: ColumnDefinition[] = [];
    export let persistenceID: string | undefined;

    const usePersistance = !!persistenceID;
    const options: Options = {
        columns,
        dataTree: true,
        dataTreeChildField: 'content',
        placeholder: 'No Data',
        clipboard: true,
        movableColumns: true,
        groupToggleElement: 'header',
        groupUpdateOnCellEdit: true,
        footerElement: '#footer',
        history: true,
        reactiveData: true,
        pagination: false,
        persistenceID,
        persistence: {
          columns: usePersistance ? [ 'width', 'visible' ] : false,
          sort: usePersistance,
          headerFilter: usePersistance,
          filter: usePersistance,
          group: usePersistance
        }
    };
  
    onMount(() => {
      const tableInstance = new Tabulator(tableContainer, {
        ...options
      });
      table = fromEvent(tableInstance, 'tableBuilt').pipe(take(1), map(() => handleTableBuilt(tableInstance)));
    });
  
    function handleTableBuilt(table: Tabulator): Tabulator {
      initHeaderMenu(table);
      return table;
    }

    function initHeaderMenu(table: Tabulator) {
      const columnSelectors = table.getColumns()
        .filter(c => !isRequired(c.getDefinition()))
        .map(column => toggleVisibilityItem(column));


      columns?.filter(c => c.headerMenu).forEach(c => {
        if (Array.isArray(c.headerMenu)) {
          if (c.headerMenu.length) {
            c.headerMenu.length = 0;
          }
          c.headerMenu.push({
            label: 'Choose columns',
            menu: [ ...columnSelectors ]
          });
        }
      });
    }

    function isRequired(def: ColumnDefinition): boolean {
      if (Array.isArray(def.validator)) {
        return 'required' in def.validator;
      }
      return def.validator === 'required';
    }
  
    $: setData($table, $data);
  
    async function setData(table: Tabulator, data: T[]): Promise<void> {
      const areEquivalent = (source: T[]) => {
        return source.length === data.length
          && source.every(item => data.map((v: T) => v[idField]).indexOf(item[idField]) > -1);
      }
  
      if (table && data) {  
        if (data.length && idField && areEquivalent(table.getData())) {
          await table.updateData(data);
          console.debug('upd', data.length);
        } else {
          await table.setData(data);
          console.debug('set', data.length);
        }
      }
    }
  </script>
  
  
  <div id="table" bind:this={tableContainer}>
  </div>
  
  <style>
    #table {
      overflow: auto;
      width: 100%;
      height: 100%;
      max-height: 100%;
    }
  </style>