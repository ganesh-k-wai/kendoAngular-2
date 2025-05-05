import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { KENDO_CHARTS } from '@progress/kendo-angular-charts';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_TOOLTIPS } from '@progress/kendo-angular-tooltip';

import { HomeComponent } from '../home/home.component';
import { KENDO_DROPDOWNS } from '@progress/kendo-angular-dropdowns';
import { DropDownButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';

import {
  DataBindingDirective,
  KENDO_GRID,
  KENDO_GRID_EXCEL_EXPORT,
  KENDO_GRID_PDF_EXPORT,
} from '@progress/kendo-angular-grid';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { process } from '@progress/kendo-data-query';
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
import { FormGroup, FormControl, Validators } from '@angular/forms';

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
    KENDO_DROPDOWNS,
    KENDO_LABEL,
    KENDO_BUTTONS,
    DropDownButtonModule,
    IconsModule,
    KENDO_TOOLTIPS,
  ],
})
export class LeadMgtComponent implements OnInit {
  @ViewChild(DataBindingDirective) dataBinding!: DataBindingDirective;
  public gridData: Employee[] = [];
  public gridView: Employee[] = [];
  public mySelection: string[] = [];
  public employees: Employee[] = [];
  public pdfSVG: SVGIcon = filePdfIcon;
  public excelSVG: SVGIcon = fileExcelIcon;
  public gearSVG: SVGIcon = gearIcon;
  public large: string = 'large';

  // private editRowIndex: number | null = null;
  // private originalData: any = null;

  public formGroup: FormGroup | null = null;
  private editedRowIndex: number | null = null;
  private isNew: boolean = false;

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.gridView = this.gridData;
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe((data) => {
      this.employees = data;
      this.gridData = data;
      this.gridView = [...this.employees];
      this.cdr.detectChanges();
    });
  }

  // addEmployee(): void {
  //   const newEmployee: Employee = {
  //     id: '',
  //     last_name: '',
  //     first_name: '',
  //     primary_email: '',
  //     primary_phone: '',
  //     assigned_date: new Date().toISOString().split('T')[0],
  //     coordinator: '',
  //     sync_to_mobile: false,
  //     sales_rep: '',
  //     booking_agency_code: 0,
  //   };
  //   console.log('Adding new employee:', newEmployee);

  //   this.gridView = [newEmployee, ...this.gridView];
  //   this.gridData = [...this.gridView];
  //   this.editRowIndex = this.gridView.indexOf(newEmployee);
  //   this.originalData = { ...newEmployee };
  //   this.cdr.detectChanges();
  // }

  public addHandler(): void {
    this.closeEditor();

    this.formGroup = new FormGroup({
      id: new FormControl('', Validators.required),
      last_name: new FormControl('', Validators.required),
      first_name: new FormControl('', Validators.required),
      primary_email: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      primary_phone: new FormControl('', Validators.required),
      assigned_date: new FormControl(new Date().toISOString().split('T')[0]),
      coordinator: new FormControl('', Validators.required),
      sync_to_mobile: new FormControl(false),
      sales_rep: new FormControl('', Validators.required),
      booking_agency_code: new FormControl(0, Validators.required),
    });
    this.isNew = true;

    this.gridView = [this.formGroup.value, ...this.gridView];
    this.editedRowIndex = 0;
  }

  public saveRow(): void {
    if (this.formGroup && this.formGroup.valid) {
      const employee = this.formGroup.value;

      if (this.isNew) {
        this.employeeService.addEmployee(employee).subscribe(() => {
          this.loadEmployees();
        });
      } else {
        const id = this.gridView[this.editedRowIndex!].id;
        this.employeeService.updateEmployee(id, employee).subscribe(() => {
          this.loadEmployees();
        });
      }

      this.closeEditor();
    }
  }

  public cancelHandler(): void {
    this.closeEditor();
  }

  private closeEditor(): void {
    this.formGroup = null;
    this.editedRowIndex = null;
    this.isNew = false;
  }

  public cellClickHandler({ rowIndex, dataItem }: any): void {
    if (this.formGroup && !this.formGroup.valid) {
      return;
    }

    this.closeEditor();

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
      assigned_date: new FormControl(dataItem.assigned_date),
      coordinator: new FormControl(dataItem.coordinator, Validators.required),
      sync_to_mobile: new FormControl(dataItem.sync_to_mobile),
      sales_rep: new FormControl(dataItem.sales_rep, Validators.required),
      booking_agency_code: new FormControl(
        dataItem.booking_agency_code,
        Validators.required
      ),
    });

    this.editedRowIndex = rowIndex;
  }

  // --------searching -------------
  public onFilter(inputValue: string): void {
    if (!this.employees.length) {
      return;
    }

    this.gridView = process(this.gridData, {
      filter: {
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
      },
    }).data;

    this.dataBinding.skip = 0;
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
