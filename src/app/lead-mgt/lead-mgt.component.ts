import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  Renderer2,
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
  KENDO_GRID,
  KENDO_GRID_EXCEL_EXPORT,
  KENDO_GRID_PDF_EXPORT,
} from '@progress/kendo-angular-grid';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { process, State, SortDescriptor } from '@progress/kendo-data-query';
import {
  SVGIcon,
  fileExcelIcon,
  filePdfIcon,
  gearIcon,
} from '@progress/kendo-svg-icons';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../employee-service.service';
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

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}

  public ngOnInit(): void {
    this.loadEmployees();

    // Add document click listener for auto-save
    this.docClickSubscription.add(
      this.renderer.listen('document', 'click', this.onDocumentClick.bind(this))
    );
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

  public savedPreferences: Array<{ id: number; text: string }> = [
    { id: 1, text: 'Default View' },
    { id: 2, text: 'Custom View 1' },
    { id: 3, text: 'Custom View 2' },
  ];

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
}
