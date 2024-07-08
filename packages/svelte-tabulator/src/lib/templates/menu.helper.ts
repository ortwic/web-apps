import type { ColumnComponent, ColumnDefinition, MenuObject } from "tabulator-tables";
import type { TableView } from "$lib/stores/table-view.store.js";

const toggleVisibilityItem = (column: ColumnComponent): MenuObject<ColumnComponent> => {
    const label = document.createElement('span');
    label.classList.add(column.isVisible() ? 'fa-check-square' : 'fa-square');
    label.textContent = column.getDefinition().title;
    return {
        label,
        action() {
            column.toggle();
            if (column.isVisible()) {
                label.classList.replace('fa-square', 'fa-check-square');
            } else {
                label.classList.replace('fa-check-square', 'fa-square');
            }
        },
    };
};

function isRequired(def: ColumnDefinition): boolean {
  if (Array.isArray(def.validator)) {
    return 'required' in def.validator;
  }
  return def.validator === 'required';
}

export function appendColumnSelectorMenu(view: TableView) {
    const columnSelectors = view.table.getColumns()
      .filter(c => !isRequired(c.getDefinition()))
      .map(column => toggleVisibilityItem(column));

    view.columns?.filter(c => c.headerMenu).forEach(c => {
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