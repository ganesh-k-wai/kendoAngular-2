// @HostListener('document:click', ['$event'])
// public onDocumentClick(event: any): void {
//   console.log('onDocumentClick triggered');
//   console.log('editRowIndex:', this.editRowIndex);
//   console.log(
//     'event.target.closest("kendo-grid"):',
//     event.target.closest('kendo-grid')
//   );

//   if (
//     this.editRowIndex !== null &&
//     (!event.target.closest('kendo-grid') ||
//       !event.target.closest('tr.k-grid-edit-row'))
//   ) {
//     event.preventDefault(); // Prevent page refresh
//     this.saveRow(this.editRowIndex);
//   }
// }

//   public onRowDoubleClick(event: any): void {
//     const rowIndex = event.rowIndex;
//     const dataItem = event.dataItem;

//     if (this.editRowIndex === null) {
//       this.editRowIndex = rowIndex;
//       this.originalData = { ...dataItem };
//       this.cdr.detectChanges();
//     }
//   }

//   private saveRow(rowIndex: number): void {
//     if (this.editRowIndex === null) return;

//     const updatedItem = this.gridView[rowIndex];

//     console.log(
//       'saveRow triggered for rowIndex:',
//       rowIndex,
//       'with data:',
//       updatedItem
//     );

//     if (!updatedItem.id || updatedItem.id.trim() === '') {
//       this.employeeService.addEmployee(updatedItem).subscribe({
//         next: (response) => {
//           console.log('New employee added successfully:', response);
//           this.loadEmployees();
//         },
//         error: (error) => {
//           console.error('Error adding new employee:', error);
//         },
//       });
//     } else {
//       this.employeeService
//         .updateEmployee(updatedItem.id, updatedItem)
//         .subscribe({
//           next: () => {
//             this.editRowIndex = null;
//             this.originalData = null;
//             this.loadEmployees();
//             this.cdr.detectChanges();
//           },
//           error: (error) => {
//             console.error('Error updating employee:', error);
//             if (this.originalData) {
//               this.gridView[rowIndex] = { ...this.originalData };
//               this.cdr.detectChanges();
//             }
//           },
//         });
//     }

//     this.editRowIndex = null;
//     this.originalData = null;
//     this.cdr.detectChanges();
//   }

//   public isRowInEditMode(rowIndex: number): boolean {
//     return this.editRowIndex === rowIndex;
//   }

//   @HostListener('document:keydown.escape', ['$event'])
//   public onEscapePress(event: KeyboardEvent): void {
//     if (this.editRowIndex !== null) {
//       this.cancelEdit();
//     }
//   }

//   public cancelEdit(): void {
//     if (this.editRowIndex !== null && this.originalData) {
//       this.gridView[this.editRowIndex] = { ...this.originalData };
//       this.editRowIndex = null;
//       this.originalData = null;
//       this.cdr.detectChanges();
//     }
//   }
