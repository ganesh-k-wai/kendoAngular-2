import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { State } from '@progress/kendo-data-query';

// Enhanced preference interface to store complete grid configuration
export interface ColumnPreference {
  id?: number;
  name: string;
  columns: string[];
  columnWidths?: { [key: string]: number };
  columnVisibility?: { [key: string]: boolean };
  columnOrderIndex?: { [key: string]: number }; // Add explicit order index tracking
  gridState?: State;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = 'http://localhost:3000/employees';
  private localStorageKey = 'columnPreferences';

  constructor(private http: HttpClient) {}

  // Get all employees
  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Get employee by ID
  getEmployeeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Add a new employee
  addEmployee(employee: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, employee);
  }

  // Update an employee
  updateEmployee(id: string, employee: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, employee);
  }

  // Delete an employee
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Column Preferences Methods using localStorage

  // Get all saved column preferences
  getColumnPreferences(): Observable<ColumnPreference[]> {
    try {
      const preferences = localStorage.getItem(this.localStorageKey);
      return of(preferences ? JSON.parse(preferences) : []);
    } catch (error) {
      console.error(
        'Error retrieving column preferences from localStorage:',
        error
      );
      return of([]);
    }
  }

  // Save a new column preference
  saveColumnPreference(
    preference: ColumnPreference
  ): Observable<ColumnPreference> {
    try {
      // Generate a unique ID
      const newId = Date.now();

      // Add timestamp and ID
      const preferenceWithData = {
        ...preference,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      // Get existing preferences
      const existingPrefsStr = localStorage.getItem(this.localStorageKey);
      const existingPrefs: ColumnPreference[] = existingPrefsStr
        ? JSON.parse(existingPrefsStr)
        : [];

      // Add new preference
      existingPrefs.push(preferenceWithData);

      // Save back to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(existingPrefs));

      return of(preferenceWithData);
    } catch (error) {
      console.error('Error saving column preference to localStorage:', error);
      return of(preference); // Return original preference on error
    }
  }

  // Delete a column preference
  deleteColumnPreference(id: number): Observable<any> {
    try {
      // Get existing preferences
      const existingPrefsStr = localStorage.getItem(this.localStorageKey);
      if (!existingPrefsStr) return of({ success: true });

      const existingPrefs: ColumnPreference[] = JSON.parse(existingPrefsStr);

      // Filter out the deleted preference
      const updatedPrefs = existingPrefs.filter((pref) => pref.id !== id);

      // Save back to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(updatedPrefs));

      return of({ success: true });
    } catch (error) {
      console.error(
        'Error deleting column preference from localStorage:',
        error
      );
      return of({ success: false });
    }
  }
}
