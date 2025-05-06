import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ColumnPreference {
  id?: number;
  name: string;
  columns: string[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = 'http://localhost:3000/employees';
  private preferencesUrl = 'http://localhost:3000/columnPreferences';

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

  // Column Preferences Methods

  // Get all saved column preferences
  getColumnPreferences(): Observable<ColumnPreference[]> {
    return this.http.get<ColumnPreference[]>(this.preferencesUrl);
  }

  // Save a new column preference
  saveColumnPreference(
    preference: ColumnPreference
  ): Observable<ColumnPreference> {
    // Add timestamp
    const preferenceWithTimestamp = {
      ...preference,
      createdAt: new Date().toISOString(),
    };
    return this.http.post<ColumnPreference>(
      this.preferencesUrl,
      preferenceWithTimestamp
    );
  }

  // Delete a column preference
  deleteColumnPreference(id: number): Observable<any> {
    return this.http.delete<any>(`${this.preferencesUrl}/${id}`);
  }
}
