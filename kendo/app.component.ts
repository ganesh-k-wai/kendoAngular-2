import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DROPDOWNLIST } from '@progress/kendo-angular-dropdowns';
import {
  CellClickEvent,
  GridComponent,
  KENDO_GRID,
} from '@progress/kendo-angular-grid';
import { Subscription } from 'rxjs';
import { ProductsService } from './products.service';

const createFormGroup = (dataItem) =>
  new FormGroup({
    Discontinued: new FormControl(dataItem.Discontinued),
    ProductID: new FormControl(dataItem.ProductID),
    ProductName: new FormControl(dataItem.ProductName, Validators.required),
    UnitPrice: new FormControl(dataItem.UnitPrice),
    UnitsInStock: new FormControl(
      dataItem.UnitsInStock,
      Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9]{1,3}'),
      ])
    ),
  });

const matches = (el, selector) =>
  (el.matches || el.msMatchesSelector).call(el, selector);

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [ReactiveFormsModule, KENDO_GRID, KENDO_DROPDOWNLIST, KENDO_BUTTONS],
  providers: [ProductsService],
  template: `
    <kendo-grid
      [data]="view"
      id="productsGrid"
      (cellClick)="cellClickHandler($event)"
      (add)="addHandler()"
    >
      <ng-template kendoGridToolbarTemplate>
        @if (!formGroup) {
        <button kendoGridAddCommand>Add new</button>
        } @if (formGroup) {
        <div>
          <button kendoButton [disabled]="!formGroup.valid" (click)="saveRow()">
            Save
          </button>
          <button kendoButton themeColor="primary" (click)="cancelHandler()">
            Cancel
          </button>
        </div>
        }
      </ng-template>
      <kendo-grid-column
        field="ProductName"
        title="Product Name"
      ></kendo-grid-column>
      <kendo-grid-column
        field="UnitPrice"
        editor="numeric"
        title="Price"
      ></kendo-grid-column>
      <kendo-grid-column
        field="Discontinued"
        editor="boolean"
        title="Discontinued"
      ></kendo-grid-column>
      <kendo-grid-column
        field="UnitsInStock"
        editor="numeric"
        title="Units In Stock"
      ></kendo-grid-column>
    </kendo-grid>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(GridComponent)
  private grid: GridComponent;

  public view: unknown[];

  public formGroup: FormGroup;

  private editedRowIndex: number;
  private docClickSubscription: Subscription = new Subscription();
  private isNew: boolean;

  constructor(private service: ProductsService, private renderer: Renderer2) {}

  public ngOnInit(): void {
    this.view = this.service.products();

    this.docClickSubscription.add(
      this.renderer.listen('document', 'click', this.onDocumentClick.bind(this))
    );
  }

  public ngOnDestroy(): void {
    this.docClickSubscription.unsubscribe();
  }

  public addHandler(): void {
    this.closeEditor();

    this.formGroup = createFormGroup({
      Discontinued: false,
      ProductName: '',
      UnitPrice: 0,
      UnitsInStock: '',
    });
    this.isNew = true;

    this.grid.addRow(this.formGroup);
  }

  public saveRow(): void {
    if (this.formGroup && this.formGroup.valid) {
      this.saveCurrent();
    }
  }

  public cellClickHandler({
    isEdited,
    dataItem,
    rowIndex,
  }: CellClickEvent): void {
    if (isEdited || (this.formGroup && !this.formGroup.valid)) {
      return;
    }

    if (this.isNew) {
      rowIndex += 1;
    }

    this.saveCurrent();

    this.formGroup = createFormGroup(dataItem);
    this.editedRowIndex = rowIndex;

    this.grid.editRow(rowIndex, this.formGroup);
  }

  public cancelHandler(): void {
    this.closeEditor();
  }

  private closeEditor(): void {
    this.grid.closeRow(this.editedRowIndex);

    this.isNew = false;
    this.editedRowIndex = undefined;
    this.formGroup = undefined;
  }

  private onDocumentClick(e: Event): void {
    if (
      this.formGroup &&
      this.formGroup.valid &&
      !matches(
        e.target,
        '#productsGrid tbody *, #productsGrid .k-grid-toolbar .k-button'
      )
    ) {
      this.saveCurrent();
    }
  }

  private saveCurrent(): void {
    if (this.formGroup) {
      this.service.save(this.formGroup.value, this.isNew);
      this.closeEditor();
    }
  }
}
