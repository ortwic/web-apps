import type { CellComponent, ColumnComponent, RowComponent, Tabulator } from 'tabulator-tables';
import { Module } from 'tabulator-tables';

type Formatter = (data: CollapsedCellData[]) => HTMLElement | undefined;

export interface CollapsedCellData {
    index: number;
    field: string;
    title: string; 
    value: string;
    element?: HTMLElement;
}

export default class ResponsiveLayout extends Module{
    static moduleName = 'responsiveLayout';

    private columns: ColumnComponent[] = [];
    private hiddenColumns: any[] = [];
    private mode: boolean | 'hide' | 'collapse' = false;
    private index = 0;
    private collapseFormatter: Formatter = () => (undefined);
    private collapseStartOpen = true;
    private collapseHandleColumn: { show: () => void; hide: () => void; } = {
        show: () => {},
        hide: () => {}
    };

    constructor(table: Tabulator){
        super(table);

        super.registerTableOption('responsiveLayout', false); //responsive layout flags
        super.registerTableOption('responsiveLayoutCollapseStartOpen', true); //start showing collapsed data
        super.registerTableOption('responsiveLayoutCollapseUseFormatters', true); //responsive layout collapse formatter
        super.registerTableOption('responsiveLayoutCollapseFormatter', false); //responsive layout collapse formatter

        super.registerColumnOption('responsive');
    }

    //generate responsive columns list
    initialize(){
        if(this.table.options.responsiveLayout){
            super.subscribe('column-layout', (...args) => this.initializeColumn.bind(this, ...args));
            super.subscribe('column-show', (...args) => this.updateColumnVisibility.bind(this, ...args));
            super.subscribe('column-hide', (...args) => this.updateColumnVisibility.bind(this, ...args));
            super.subscribe('columns-loaded', this.initializeResponsivity.bind(this));
            super.subscribe('column-moved', this.initializeResponsivity.bind(this));
            super.subscribe('column-add', this.initializeResponsivity.bind(this));
            super.subscribe('column-delete', this.initializeResponsivity.bind(this));

            super.subscribe('table-redrawing', this.tableRedraw.bind(this));

            if(this.table.options.responsiveLayout === 'collapse'){
                super.subscribe('row-data-changed', (...args) => this.generateCollapsedRowContent.bind(this, ...args));
                super.subscribe('row-init', (...args) => this.initializeRow.bind(this, ...args));
                super.subscribe('row-layout', (...args) => this.layoutRow.bind(this, ...args));
            }
        }
    }

    tableRedraw = (force: any) => {
        const layoutMode = this.table.modules.layout.getMode();
        if(['fitColumns', 'fitDataStretch'].indexOf(layoutMode) === -1){
            if(!force){
                this.update();
            }
        }
    };

    initializeResponsivity(){
        this.mode = this.table.options.responsiveLayout ?? false;
        this.collapseFormatter = this.table.options.responsiveLayoutCollapseFormatter || this.defaultFormatter;
        this.collapseStartOpen = this.table.options.responsiveLayoutCollapseStartOpen || true;
        this.hiddenColumns = [];

        //determine level of responsivity for each column
        const columns = this.table.columnManager.columnsByIndex
            .filter((c: { modules: { responsive: { order: any; visible: any; }; }; }) => c.modules.responsive?.order && c.modules.responsive.visible)
            .map((column: { modules: { responsive: { index: any; }; }; }, i: any) => {
                column.modules.responsive.index = i;
                return column;
            });

        if (this.mode === 'collapse') {
            this.hiddenColumns = columns.filter((c: { visible: any; }) => !c?.visible);
        }

        this.columns = this.sortListByResponsivity(columns);

        if(this.mode === 'collapse'){
            this.generateCollapsedContent();
        }

        //assign collapse column
        this.collapseHandleColumn = this.table.columnManager.columns.find((c: { definition: { formatter: string; }; }) => c.definition.formatter == 'responsiveCollapse');
        if(this.collapseHandleColumn){
            if(this.hiddenColumns.length){
                this.collapseHandleColumn.show();
            }else{
                this.collapseHandleColumn.hide();
            }
        }
    }

    sortListByResponsivity = (columns: any[]): any[] => {
        return columns.reverse().sort((a: { modules: { responsive: { order: number; index: number; }; }; }, b: { modules: { responsive: { order: number; index: number; }; }; }) => {
            const diff = b.modules.responsive.order - a.modules.responsive.order;
            return diff || (b.modules.responsive.index - a.modules.responsive.index);
        });
    };

    //define layout information
    initializeColumn(column: { getDefinition: () => any; modules: { responsive: { order: any; visible: boolean; }; }; }){
        const def = column.getDefinition();

        column.modules.responsive = {
            order: typeof def.responsive === 'undefined' ? 1 : def.responsive, 
            visible: def.visible === false ? false : true
        };
    }

    initializeRow(row: { type: string; modules: { responsiveLayout: { element: HTMLDivElement; open: boolean; }; }; }){
        if(row.type !== 'calc'){
            const collapseEl = document.createElement('div');
            collapseEl.classList.add('tabulator-responsive-collapse');

            row.modules.responsiveLayout = {
                element: collapseEl,
                open: this.collapseStartOpen,
            };

            if(this.collapseStartOpen){
                collapseEl.classList.add('open');
            }
        }
    }

    layoutRow(row: { getElement: () => any; modules: { responsiveLayout: { element: any; }; }; }){
        const rowEl = row.getElement();

        if(row.modules.responsiveLayout){
            rowEl.appendChild(row.modules.responsiveLayout.element);
            this.generateCollapsedRowContent(row);
        }
    }

    //update column visibility
    updateColumnVisibility(column: { modules: { responsive: { visible: any; }; }; visible: any; }, responsiveToggle: any){
        if(!responsiveToggle && column.modules.responsive){
            column.modules.responsive.visible = column.visible;
            this.initializeResponsivity();
        }
    }

    hideColumn(column: any){
        const colCount = this.hiddenColumns.length;

        column.hide(false, true);

        if(this.mode === 'collapse'){
            this.hiddenColumns.unshift(column);
            this.generateCollapsedContent();

            if(this.collapseHandleColumn && !colCount){
                this.collapseHandleColumn.show();
            }
        }
    }

    showColumn(column: any){
        column.show(false, true);
        //set column width to prevent calculation loops on uninitialized columns
        column.setWidth(column.getWidth());

        if(this.mode === 'collapse'){
            const index = this.hiddenColumns.indexOf(column);

            if(index > -1){
                this.hiddenColumns.splice(index, 1);
            }

            this.generateCollapsedContent();

            if(this.collapseHandleColumn && !this.hiddenColumns.length){
                this.collapseHandleColumn.hide();
            }
        }
    }

    //redraw columns to fit space
    update = () => {
        let working = true;

        while(working){

            const width = this.table.modules.layout.getMode() == 'fitColumns' ? this.table.columnManager.getFlexBaseWidth() : this.table.columnManager.getWidth();

            const diff = (this.table.options.headerVisible ? this.table.columnManager.element.clientWidth : this.table.element.clientWidth) - width;

            if(diff < 0){
                //table is too wide
                const column = this.columns[this.index];

                if(column){
                    this.hideColumn(column);
                    this.index ++;
                }else{
                    working = false;
                }

            }else{

                //table has spare space
                const column = this.columns[this.index -1];

                if(column){
                    if(diff > 0){
                        if(diff >= column.getWidth()){
                            this.showColumn(column);
                            this.index --;
                        }else{
                            working = false;
                        }
                    }else{
                        working = false;
                    }
                }else{
                    working = false;
                }
            }

            if(!this.table.rowManager.activeRowsCount){
                this.table.rowManager.renderEmptyScroll();
            }
        }
    };

    generateCollapsedContent = () => {
        this.table.rowManager.getDisplayRows()
            .forEach((row: any) => this.generateCollapsedRowContent(row));
    };

    generateCollapsedRowContent = (row: { modules: { responsiveLayout: { element: any; }; }; }) => {
        if(row.modules.responsiveLayout && this.mode === 'collapse'){
            const collapseEl = row.modules.responsiveLayout.element;

            // always clear content before redraw
            while(collapseEl.firstChild){
                collapseEl.removeChild(collapseEl.firstChild);
            }
            
            if (!collapseEl.firstChild) {
                const data = this.generateCollapsedRowData(row);

                // redraw contents
                const contents = this.collapseFormatter(data);
                if(contents){
                    collapseEl.appendChild(contents);
                }
            }
        }
    };

    langBind = this.table.modules.localize;

    generateCollapsedRowData = (row: any): CollapsedCellData[] => {
        const data = row.getData();
        const output: CollapsedCellData[] = [];

        // console.log(this.hiddenColumns.map(c => ({ t: c.field, r: c.modules.responsive.order })));

        this.hiddenColumns.forEach((column) => {
            const field = column.field;
            const value = column.getFieldValue(data);
            const index = column.definition.responsive;
            if(column.definition.title && index >= 0){
                const format = column.modules.format;
                let title = !column.modules.format.params?.hideTitle ? column.definition.title : '';
                if(format && this.table.options.responsiveLayoutCollapseUseFormatters){
                    const cell = <CellComponent>row.getCell(field);
                    const element = cell.getElement();
                    // TODO cloneNode() to fix show/hide column https://github.com/ortwic/song-repo/issues/31
                    // element = element.cloneNode(true);
                    
                    if (title) {
                        this.langBind('columns|' + field, (text: any) => title = text || title);
                    }

                    element.title = column.definition.title;
                    element.style.display = 'block';
                    output.push({
                        index,
                        field,
                        title,
                        value,
                        element
                    });
                }else{
                    output.push({
                        index,
                        field,
                        title,
                        value
                    });
                }
            }
        });

        return output.sort((a, b) => a.index - b.index);
    };

    defaultFormatter(data: CollapsedCellData[]): HTMLElement | undefined {
        const list = document.createElement('div');
        list.classList.add('flex');
        let lastIndex = -1;

        data.forEach(({ index, title, value, element }) => {
            const row = document.createElement('div');

            if (title) {
                const label = document.createElement('label');
                label.innerHTML = title;
                row.appendChild(label);
            }

            if(element){
                element.style.height = 'auto';
                row.appendChild(element);
            }else if(value !== undefined){
                const p = document.createElement('p');
                p.innerHTML = value;
                row.appendChild(p);
            }

            if (lastIndex !== index) {
                const div = document.createElement('div');
                div.classList.add('break');
                list.appendChild(div);
            }
            
            lastIndex = index;
            list.appendChild(row);
        }, this);

        return Object.keys(data).length ? list : undefined;
    }
}