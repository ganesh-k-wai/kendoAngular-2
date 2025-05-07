import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  Renderer2,
  QueryList,
} from '@angular/core';
import { KENDO_CHARTS } from '@progress/kendo-angular-charts';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_TOOLTIPS } from '@progress/kendo-angular-tooltip';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';

import { HomeComponent } from '../home/home.component';
import { KENDO_DROPDOWNS } from '@progress/kendo-angular-dropdowns';
import { DropDownButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';

import {
  DataBindingDirective,
  GridComponent,
  GridDataResult,
  PageChangeEvent,
  ColumnReorderEvent,
  ColumnBase,
  ColumnComponent,
  KENDO_GRID,
  KENDO_GRID_EXCEL_EXPORT,
  KENDO_GRID_PDF_EXPORT,
} from '@progress/kendo-angular-grid';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { KENDO_DIALOG } from '@progress/kendo-angular-dialog';
import { process, State, SortDescriptor } from '@progress/kendo-data-query';
import {
  SVGIcon,
  fileExcelIcon,
  filePdfIcon,
  gearIcon,
} from '@progress/kendo-svg-icons';
import { FormsModule } from '@angular/forms';
import { EmployeeService, ColumnPreference } from '../employee-service.service';
import { ChangeDetectorRef } from '@angular/core';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subscription } from 'rxjs';

// Helper function to check if an element matches a selector
const matches = (el: any, selector: string) =>
  (el.matches || el.msMatchesSelector).call(el, selector);

// Type augmentation for ColumnBase to include field property
declare module '@progress/kendo-angular-grid' {
  interface ColumnBase {
    field?: string;
  }

  interface GridComponent {
    removeColumn(column: ColumnComponent): void;
    addColumn(column: ColumnComponent): void;
    columns: QueryList<ColumnBase>; // Fix the columns property to use QueryList<ColumnBase> instead of any
  }
}

export interface Employee {
  id: string;
  last_name: string;
  first_name: string;
  primary_email: string;
  primary_phone: string;
  assigned_date: string;
  coordinator: string;
  sync_to_mobile: boolean;
  sales_rep: string;
  booking_agency_code: number;
  experience?: string; // Adding new field for experience
}
@Component({
  selector: 'app-lead-mgt',
  standalone: true,
  templateUrl: './lead-mgt.component.html',
  styleUrl: './lead-mgt.component.css',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    KENDO_GRID,
    KENDO_CHARTS,
    KENDO_INPUTS,
    KENDO_GRID_PDF_EXPORT,
    KENDO_GRID_EXCEL_EXPORT,
    HomeComponent,
    FormsModule,
    ReactiveFormsModule,
    KENDO_DROPDOWNS,
    KENDO_LABEL,
    KENDO_BUTTONS,
    DropDownButtonModule,
    IconsModule,
    KENDO_TOOLTIPS,
    DateInputsModule,
    KENDO_DIALOG,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class LeadMgtComponent implements OnInit, OnDestroy {
  @ViewChild(DataBindingDirective) dataBinding!: DataBindingDirective;
  @ViewChild(GridComponent) private grid!: GridComponent;

  public gridData: Employee[] = [];
  public gridView: GridDataResult = { data: [], total: 0 };
  public mySelection: string[] = [];
  public employees: Employee[] = [];
  public pdfSVG: SVGIcon = filePdfIcon;
  public excelSVG: SVGIcon = fileExcelIcon;
  public gearSVG: SVGIcon = gearIcon;
  public large: string = 'large';

  // State variables for grid
  public state: State = {
    skip: 0,
    take: 10,
    filter: undefined,
    sort: undefined,
    group: undefined,
  };

  public formGroup: FormGroup | null = null;
  private editedRowIndex: number | null = null;
  private isNew: boolean = false;
  private docClickSubscription: Subscription = new Subscription();

  // Experience level options for dropdown
  public experienceOptions: Array<string> = [
    'Below 1 Year',
    '1-2 Years',
    '2-3 Years',
    'Above 3 Years',
    'Above 5 Years',
  ];

  // Column preference properties
  public columnOrder: string[] = [];
  public defaultColumnOrder: string[] = [];
  public savedPreferences: ColumnPreference[] = [];
  public selectedPreferenceId: number | null = null;
  public showSaveDialog: boolean = false;
  public newPreferenceName: string = '';

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}

  public ngOnInit(): void {
    this.loadEmployees();
    this.loadColumnPreferences();

    // Add document click listener for auto-save
    this.docClickSubscription.add(
      this.renderer.listen('document', 'click', this.onDocumentClick.bind(this))
    );

    // Initialize grid after a short delay to ensure it's rendered
    setTimeout(() => this.onGridInit(), 100);
  }

  public ngOnDestroy(): void {
    // Clean up the subscription when component is destroyed
    this.docClickSubscription.unsubscribe();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe((data) => {
      // Reverse the data array to display from bottom to top
      this.employees = data.reverse();
      this.gridData = this.employees;
      this.loadItems();
      this.cdr.detectChanges();
    });
  }

  // Process the data with paging
  private loadItems(): void {
    this.gridView = process(this.gridData, this.state);
  }

  // Handle page change events
  public pageChange(event: PageChangeEvent): void {
    this.state.skip = event.skip;
    this.loadItems();
  }

  public addHandler(): void {
    this.closeEditor();

    this.formGroup = new FormGroup({
      id: new FormControl(this.generateUniqueId(), Validators.required),
      last_name: new FormControl('', Validators.required),
      first_name: new FormControl('', Validators.required),
      primary_email: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      primary_phone: new FormControl('', Validators.required),
      assigned_date: new FormControl(new Date()), // Create a proper Date object
      coordinator: new FormControl('', Validators.required),
      sync_to_mobile: new FormControl(false),
      sales_rep: new FormControl('', Validators.required),
      booking_agency_code: new FormControl(0, Validators.required),
      experience: new FormControl('Below 1 Year'),
    });
    this.isNew = true;

    this.grid.addRow(this.formGroup);
  }

  // Generate a unique ID with length between 5-7 characters
  private generateUniqueId(): string {
    // Create base random string
    const randomStr = Math.random().toString(36).substring(2, 15);

    // Generate a random length between 5 and 7
    const idLength = Math.floor(Math.random() * 3) + 5; // Random number: 5, 6, or 7

    // Take a substring of the random string with the desired length
    return randomStr.substring(0, idLength);
  }

  public saveRow(): void {
    if (this.formGroup && this.formGroup.valid) {
      this.saveCurrent();
    }
  }

  // Method to save the current record
  private saveCurrent(): void {
    if (this.formGroup && this.formGroup.valid) {
      const formValues = this.formGroup.value;

      // Format the date properly before saving
      const employee = {
        ...formValues,
        assigned_date:
          formValues.assigned_date instanceof Date
            ? formValues.assigned_date.toISOString().split('T')[0]
            : formValues.assigned_date,
      };

      if (this.isNew) {
        // Add new records to the end of the array (bottom of the grid)
        this.gridData.push(employee);
        this.employeeService.addEmployee(employee).subscribe(() => {
          // Reload all employees from server
          this.loadEmployees();
        });
      } else if (this.editedRowIndex !== null) {
        // Add null safety check for state.skip
        const skip = this.state?.skip || 0;
        const dataIndex = skip + this.editedRowIndex;
        if (dataIndex < this.gridData.length) {
          const id = this.gridData[dataIndex].id;
          this.gridData[dataIndex] = employee;
          this.employeeService.updateEmployee(id, employee).subscribe(() => {
            // Reload all employees from server
            this.loadEmployees();
          });
        }
      }

      this.closeEditor();
    }
  }

  private closeEditor(): void {
    // Close the row at the tracked index
    if (this.grid && this.editedRowIndex !== null) {
      this.grid.closeRow(this.editedRowIndex);
    }

    this.isNew = false;
    this.editedRowIndex = null;
    this.formGroup = null;

    // Update the grid view with current data
    this.loadItems();
  }

  // Cancel handler - simplified to match reference implementation
  public cancelHandler(): void {
    this.closeEditor();
  }

  public cellClickHandler({ isEdited, rowIndex, dataItem }: any): void {
    if (isEdited || (this.formGroup && !this.formGroup.valid)) {
      return;
    }

    this.closeEditor();

    // Create a Date object from the string date
    const assignedDate = dataItem.assigned_date
      ? new Date(dataItem.assigned_date)
      : new Date();

    this.formGroup = new FormGroup({
      id: new FormControl(dataItem.id, Validators.required),
      last_name: new FormControl(dataItem.last_name, Validators.required),
      first_name: new FormControl(dataItem.first_name, Validators.required),
      primary_email: new FormControl(dataItem.primary_email, [
        Validators.required,
        Validators.email,
      ]),
      primary_phone: new FormControl(
        dataItem.primary_phone,
        Validators.required
      ),
      assigned_date: new FormControl(assignedDate),
      coordinator: new FormControl(dataItem.coordinator, Validators.required),
      sync_to_mobile: new FormControl(dataItem.sync_to_mobile),
      sales_rep: new FormControl(dataItem.sales_rep, Validators.required),
      booking_agency_code: new FormControl(
        dataItem.booking_agency_code,
        Validators.required
      ),
      experience: new FormControl(dataItem.experience || 'Below 1 Year'),
    });

    this.editedRowIndex = rowIndex;
    this.grid.editRow(rowIndex, this.formGroup);
  }

  // Document click handler for auto-save
  private onDocumentClick(e: Event): void {
    if (
      this.formGroup &&
      this.formGroup.valid &&
      !matches(e.target, '.k-grid tbody *, .k-grid .k-grid-toolbar .k-button')
    ) {
      this.saveCurrent();
    }
  }

  // --------searching -------------
  public onFilter(inputValue: string): void {
    if (!this.employees.length) {
      return;
    }

    this.state.filter = {
      logic: 'or',
      filters: [
        {
          field: 'last_name',
          operator: 'contains',
          value: inputValue,
        },
        {
          field: 'first_name',
          operator: 'contains',
          value: inputValue,
        },
        {
          field: 'primary_email',
          operator: 'contains',
          value: inputValue,
        },
        {
          field: 'primary_phone',
          operator: 'contains',
          value: inputValue,
        },
        {
          field: 'coordinator',
          operator: 'contains',
          value: inputValue,
        },
        {
          field: 'sales_rep',
          operator: 'contains',
          value: inputValue,
        },
        {
          field: 'booking_agency_code',
          operator: 'eq',
          value: inputValue,
        },
      ],
    };

    this.loadItems();
    this.state.skip = 0;
  }

  // -----------this is for edit and update cancel edit---------------

  //  -------------------row data for dropdown----------------
  public listItems: Array<string> = [
    'Baseball',
    'Basketball',
    'Cricket',
    'Field Hockey',
  ];
  public value = ['Basketball', 'Cricket'];

  public actions: Array<{ text: string; icon: string }> = [
    { text: 'View Lead', icon: 'bi-eye' },
    { text: 'Edit Lead', icon: 'bi-pencil' },
    { text: 'Assign to Sales Rep', icon: 'bi-person-plus' },
    { text: 'Schedule Appointment', icon: 'bi-calendar' },
    { text: 'Possible Matches', icon: 'bi-search' },
  ];
  // ---------save preference data --------

  public selectedLead: any = null;

  selectLead(lead: any): void {
    this.selectedLead = lead;
    console.log('Selected Lead:', lead);
    // Add logic to filter your grid if needed
  }

  // Selected preference
  public selectedPreference: { id: number; text: string } | null = null;

  // Handle preference selection
  public onPreferenceSelect(preference: { id: number; text: string }): void {
    this.selectedPreference = preference;
    console.log('Selected Preference:', preference);
    // Add logic to apply the selected preference
    if (preference.id === 1) {
      console.log('Applying Default View...');
    } else if (preference.id === 2) {
      console.log('Applying Custom View 1...');
    } else if (preference.id === 3) {
      console.log('Applying Custom View 2...');
    }
  }

  // Save the initial column order when grid is first rendered
  public onGridInit(): void {
    // Wait for grid to initialize
    setTimeout(() => {
      if (this.grid) {
        try {
          // Get all column fields from the grid
          this.defaultColumnOrder = this.grid.columns
            .toArray()
            .filter((col) => col.field) // Only columns with field property
            .map((col) => col.field || '');

          // Set current order to default
          this.columnOrder = [...this.defaultColumnOrder];
        } catch (error) {
          console.error('Error initializing column order:', error);
        }
      }
    }, 100);
  }

  // Track column reordering with DOM-based detection for accuracy
  public onColumnReorder(event: ColumnReorderEvent): void {
    if (this.grid) {
      try {
        console.log('==== COLUMN REORDER EVENT ====');
        console.log('Column being moved:', event.column.field);
        console.log('New index:', event.newIndex);
        console.log('Old index:', event.oldIndex);

        // Use a longer timeout to ensure DOM has time to fully update
        setTimeout(() => {
          // METHOD 1: Get order directly from DOM (most accurate)
          const headerCells = document.querySelectorAll(
            '.k-grid-header th[data-field]'
          );

          if (headerCells.length > 0) {
            // Extract field names from the DOM in their current visual order
            const domOrder: string[] = [];
            headerCells.forEach((header: Element) => {
              const field = header.getAttribute('data-field');
              if (field) {
                domOrder.push(field);
              }
            });

            console.log('DOM-based column order:', domOrder);

            // Only update if we found some columns in the DOM
            if (domOrder.length > 0) {
              this.columnOrder = [...domOrder];
              console.log('Updated columnOrder from DOM:', this.columnOrder);
              return;
            }
          }

          // METHOD 2: Fallback to using the Grid component's columns
          console.warn(
            'DOM-based detection failed, falling back to component-based detection'
          );
          const allColumns = this.grid.columns.toArray();
          const componentOrder = allColumns
            .filter((col) => col.field)
            .map((col) => col.field || '');

          console.log('Component-based column order:', componentOrder);
          this.columnOrder = [...componentOrder];
        }, 200); // Longer timeout to ensure DOM is updated
      } catch (error) {
        console.error('Error tracking column reorder:', error);
      }
    }
  }

  // Load saved column preferences from localStorage
  private loadColumnPreferences(): void {
    this.employeeService.getColumnPreferences().subscribe({
      next: (preferences) => {
        this.savedPreferences = preferences;
        console.log(
          'Loaded preferences from localStorage:',
          this.savedPreferences
        );
      },
      error: (error) => {
        console.error('Error loading column preferences:', error);
      },
    });
  }

  // Open save preference dialog
  public openSavePreferenceDialog(): void {
    this.showSaveDialog = true;
    this.newPreferenceName = '';
  }

  // Close save preference dialog
  public closeSavePreferenceDialog(): void {
    this.showSaveDialog = false;
  }

  // Save current column preference
  public savePreference(): void {
    if (!this.newPreferenceName.trim()) {
      alert('Please enter a name for this preference');
      return;
    }

    // Capture complete grid configuration including column order, widths, and visibility
    const gridConfig = this.captureGridConfiguration();
    console.log('Captured grid configuration:', gridConfig);

    // Create enhanced preference with additional grid details
    const preference: ColumnPreference = {
      name: this.newPreferenceName.trim(),
      columns: gridConfig.columns,
      columnWidths: gridConfig.columnWidths,
      columnVisibility: gridConfig.columnVisibility,
      columnOrderIndex: gridConfig.columnOrderIndex, // Include explicit order indexes
      gridState: { ...this.state }, // Include current grid state (sorting, paging, etc.)
    };

    this.employeeService.saveColumnPreference(preference).subscribe({
      next: (saved) => {
        console.log('Enhanced preference saved to localStorage:', saved);
        this.savedPreferences.push(saved);
        this.showSaveDialog = false;
        this.selectedPreferenceId = saved.id || null;
      },
      error: (error) => {
        console.error('Error saving preference:', error);
        alert('Failed to save preference. Please try again.');
      },
    });
  }

  // Apply a saved preference with complete grid configuration
  public applyPreference(preference: ColumnPreference): void {
    if (!preference || !preference.columns || !preference.columns.length) {
      return;
    }

    console.log('Applying preference:', preference);
    this.selectedPreferenceId = preference.id || null;
    this.columnOrder = [...preference.columns];

    // Apply saved grid state if available (sorting, filtering, etc)
    if (preference.gridState) {
      // Don't overwrite the entire state as it might have refs to functions
      // Just copy the serializable parts
      if (preference.gridState.skip !== undefined)
        this.state.skip = preference.gridState.skip;
      if (preference.gridState.take !== undefined)
        this.state.take = preference.gridState.take;
      if (preference.gridState.sort)
        this.state.sort = preference.gridState.sort;
      if (preference.gridState.group)
        this.state.group = preference.gridState.group;
      if (preference.gridState.filter)
        this.state.filter = preference.gridState.filter;

      console.log('Applied grid state from preference:', this.state);
    }

    // Reorder columns in the grid
    this.reorderGridColumnsWithConfig(preference);
  }

  // Delete a saved preference
  public deletePreference(id: number): void {
    if (confirm('Are you sure you want to delete this preference?')) {
      this.employeeService.deleteColumnPreference(id).subscribe({
        next: () => {
          console.log('Deleted preference from localStorage:', id);
          this.savedPreferences = this.savedPreferences.filter(
            (p) => p.id !== id
          );
          if (this.selectedPreferenceId === id) {
            this.resetToDefaultOrder();
          }
        },
        error: (error) => {
          console.error('Error deleting preference:', error);
          alert('Failed to delete preference. Please try again.');
        },
      });
    }
  }

  // Reset to default column order
  public resetToDefaultOrder(): void {
    this.selectedPreferenceId = null;
    this.columnOrder = [...this.defaultColumnOrder];
    this.reorderGridColumns();
  }

  // Reorder grid columns based on columnOrder array
  private reorderGridColumns(): void {
    if (!this.grid || !this.columnOrder.length) {
      return;
    }

    try {
      console.log('Applying column order:', this.columnOrder);

      // Get all current columns including non-field columns like checkbox column
      const allColumns = this.grid.columns.toArray();

      // Identify special columns (like checkbox columns)
      const specialColumns = allColumns.filter((col) => !col.field);

      // Create a map of the current columns for easy access by field name
      const columnMap = new Map<string, any>();
      allColumns.forEach((col, index) => {
        if (col.field) {
          columnMap.set(col.field, { column: col, index });
        }
      });

      // We'll move one column at a time to build the desired order
      // First, calculate the current positions of columns
      const currentOrder = allColumns
        .filter((col) => col.field)
        .map((col) => col.field || '');

      console.log('Current column order:', currentOrder);
      console.log('Target column order:', this.columnOrder);

      // For each position in the target order, find which column needs to move there
      for (
        let targetIndex = 0;
        targetIndex < this.columnOrder.length;
        targetIndex++
      ) {
        const targetField = this.columnOrder[targetIndex];
        const actualIndex = currentOrder.indexOf(targetField);

        // Skip if column is already in the right position
        if (actualIndex === targetIndex) {
          continue;
        }

        // Calculate the real index including special columns
        const realTargetIndex = targetIndex + specialColumns.length;
        const columnInfo = columnMap.get(targetField);

        if (columnInfo) {
          console.log(
            `Moving column ${targetField} to position ${realTargetIndex}`
          );

          // Use the proper method signature for reorderColumn
          this.grid.reorderColumn(columnInfo.column, realTargetIndex);

          // Update the current order to reflect the change
          currentOrder.splice(actualIndex, 1);
          currentOrder.splice(targetIndex, 0, targetField);
        }
      }

      // Force grid refresh
      this.loadItems();

      // Force change detection in case the UI doesn't update
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 50);
    } catch (error) {
      console.error('Error reordering columns:', error);
    }
  }

  // Reorder grid columns with complete configuration including widths and visibility
  private reorderGridColumnsWithConfig(preference: ColumnPreference): void {
    if (!this.grid || !preference.columns || !preference.columns.length) {
      return;
    }

    try {
      console.log(
        'Applying complete grid configuration from preference:',
        preference
      );

      // Get all current columns including special columns like checkbox column
      const allColumns = this.grid.columns.toArray();

      // Identify special columns (like checkbox columns)
      const specialColumns = allColumns.filter((col) => !col.field);

      // Create a map of the current columns for easy access by field name
      const columnMap = new Map<string, any>();
      allColumns.forEach((col, index) => {
        if (col.field) {
          columnMap.set(col.field, { column: col, index });
        }
      });

      // Get the current order of columns in the grid
      const currentOrder = allColumns
        .filter((col) => col.field)
        .map((col) => col.field || '');

      console.log('Current column order:', currentOrder);
      console.log('Target column order from preference:', preference.columns);

      // Step 1: If we have explicit order indexes, sort the columns by those indexes
      let orderedColumns = [...preference.columns];
      if (
        preference.columnOrderIndex &&
        Object.keys(preference.columnOrderIndex).length > 0
      ) {
        console.log(
          'Using explicit column order indexes:',
          preference.columnOrderIndex
        );
        // Sort columns based on their saved order index
        orderedColumns.sort((a, b) => {
          const indexA = preference.columnOrderIndex?.[a] ?? 999;
          const indexB = preference.columnOrderIndex?.[b] ?? 999;
          return indexA - indexB;
        });
        console.log('Columns ordered by explicit indexes:', orderedColumns);
      }

      // Step 2: Apply the column order
      for (
        let targetIndex = 0;
        targetIndex < orderedColumns.length;
        targetIndex++
      ) {
        const targetField = orderedColumns[targetIndex];
        const actualIndex = currentOrder.indexOf(targetField);

        // Skip if column is already in the right position
        if (actualIndex === targetIndex) {
          continue;
        }

        // Calculate the real index including special columns
        const realTargetIndex = targetIndex + specialColumns.length;
        const columnInfo = columnMap.get(targetField);

        if (columnInfo) {
          console.log(
            `Moving column ${targetField} to position ${realTargetIndex}`
          );

          // Use the proper method signature for reorderColumn
          this.grid.reorderColumn(columnInfo.column, realTargetIndex);

          // Update our tracking of the current order
          currentOrder.splice(actualIndex, 1);
          currentOrder.splice(targetIndex, 0, targetField);
        }
      }

      // Step 3: Apply column widths if available
      if (
        preference.columnWidths &&
        Object.keys(preference.columnWidths).length > 0
      ) {
        // Delay slightly to ensure reorder is complete
        setTimeout(() => {
          Object.entries(preference.columnWidths!).forEach(([field, width]) => {
            const columnInfo = columnMap.get(field);
            if (columnInfo?.column) {
              // Set column width through DOM for immediate visual feedback
              try {
                const headerCell = document.querySelector(
                  `.k-grid-header th[data-field="${field}"]`
                ) as HTMLElement;
                if (headerCell) {
                  // Apply through both column object and DOM for full effect
                  columnInfo.column.width = `${width}px`;
                  headerCell.style.width = `${width}px`;
                }
              } catch (widthError) {
                console.warn(
                  `Could not set width for column ${field}:`,
                  widthError
                );
              }
            }
          });

          // Force refresh after width adjustments
          this.cdr.detectChanges();
        }, 100);
      }

      // Step 4: Apply column visibility if available
      if (
        preference.columnVisibility &&
        Object.keys(preference.columnVisibility).length > 0
      ) {
        // Handle column visibility in a future implementation
        // This would require removing and re-adding columns to the grid
        console.log(
          'Column visibility will be applied in a future implementation'
        );
      }

      // Force grid refresh
      this.loadItems();

      // Final force change detection
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 200);
    } catch (error) {
      console.error('Error applying complete grid configuration:', error);
      // Fall back to basic column reordering if the enhanced version fails
      this.reorderGridColumns();
    }
  }

  // Debug function to check current column order
  public debugColumnOrder(): void {
    console.log('=== COLUMN ORDER DEBUG ===');
    console.log('Default column order:', this.defaultColumnOrder);
    console.log('Current column order:', this.columnOrder);

    // Print actual order from grid
    if (this.grid) {
      const actualColumnOrder = this.grid.columns
        .toArray()
        .filter((col) => col.field)
        .map((col) => col.field);
      console.log('Actual grid column order:', actualColumnOrder);
    }

    // Force update of columnOrder to match actual grid state
    if (this.grid) {
      this.columnOrder = this.grid.columns
        .toArray()
        .filter((col) => col.field)
        .map((col) => col.field || '');

      console.log('Updated column order:', this.columnOrder);
      alert('Column order logged to console');
    }
  }

  // For dropdown display
  public preferenceText(item: ColumnPreference): string {
    return item.name;
  }

  // Update the existing clear filters method or add it if it doesn't exist
  public clearFilters(): void {
    // Reset filters
    this.state.filter = undefined;

    // Reset to default column order
    this.resetToDefaultOrder();

    // Refresh grid
    this.loadItems();
    this.state.skip = 0;
  }

  // Enhanced method to capture complete grid configuration when saving preferences
  private captureGridConfiguration(): {
    columns: string[];
    columnWidths: { [key: string]: number };
    columnVisibility: { [key: string]: boolean };
    columnOrderIndex: { [key: string]: number };
  } {
    // Default empty configuration
    const config = {
      columns: [...this.defaultColumnOrder],
      columnWidths: {} as { [key: string]: number },
      columnVisibility: {} as { [key: string]: boolean },
      columnOrderIndex: {} as { [key: string]: number }, // Add order index tracking
    };

    if (!this.grid) return config;

    try {
      // METHOD 1: Get order directly from DOM (most accurate)
      const headerCells = document.querySelectorAll(
        '.k-grid-header th[data-field]'
      );

      if (headerCells && headerCells.length > 0) {
        // Extract field names and widths from the DOM in their current visual order
        const domOrder: string[] = [];
        const widths: { [key: string]: number } = {};
        const visibility: { [key: string]: boolean } = {};
        const orderIndex: { [key: string]: number } = {}; // Track order index of each column

        headerCells.forEach((header: Element, index: number) => {
          const field = header.getAttribute('data-field');
          if (field) {
            domOrder.push(field);
            // Capture width by getting offsetWidth of the cell
            widths[field] = (header as HTMLElement).offsetWidth;
            visibility[field] = true; // Visible since we found it in DOM
            orderIndex[field] = index; // Store the actual visual index
          }
        });

        if (domOrder.length > 0) {
          console.log('DOM-based column order captured:', domOrder);
          console.log('Column widths captured:', widths);
          console.log('Column order indexes captured:', orderIndex);

          config.columns = [...domOrder];
          config.columnWidths = { ...widths };
          config.columnVisibility = { ...visibility };
          config.columnOrderIndex = { ...orderIndex };

          // Also check for any columns in default that aren't visible
          this.defaultColumnOrder.forEach((field) => {
            if (!domOrder.includes(field)) {
              visibility[field] = false; // Mark as not visible
            }
          });

          return config;
        }
      }

      // METHOD 2: Fallback to using the Grid component's columns
      console.warn(
        'DOM-based detection failed, falling back to component-based detection'
      );
      const allColumns = this.grid.columns.toArray();
      const componentOrder = allColumns
        .filter((col) => col.field)
        .map((col) => col.field || '');

      if (componentOrder.length > 0) {
        config.columns = [...componentOrder];

        // Try to get widths and build order indexes from column components
        allColumns.forEach((col, index) => {
          if (col.field && col.field !== '') {
            // Store the order index
            config.columnOrderIndex[col.field] = componentOrder.indexOf(
              col.field
            );

            // Handle column width
            if (col.width !== undefined) {
              // Handle different types of width values properly
              if (typeof col.width === 'string') {
                // Remove 'px' if present and convert to number
                const widthStr = col.width as string;
                config.columnWidths[col.field] =
                  parseInt(widthStr.replace('px', ''), 10) || 100;
              } else if (typeof col.width === 'number') {
                // If it's already a number, use it directly
                config.columnWidths[col.field] = col.width as number;
              } else {
                // Default value for other types
                config.columnWidths[col.field] = 100;
              }
            }
            config.columnVisibility[col.field] = true;
          }
        });
      }

      return config;
    } catch (error) {
      console.error('Error capturing grid configuration:', error);
      return config;
    }
  }
}
