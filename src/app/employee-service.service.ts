import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = 'http://localhost:3000/employees';

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
}
