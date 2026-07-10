import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LabResult {
  id?: string;
  title: string;
  description?: string;
  customerId?: number;
  status?: string;
  results?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabRequest {
  title: string;
  description?: string;
  customerId?: number;
}

@Injectable({ providedIn: 'root' })
export class LabService {
  private readonly apiUrl = '/api/labs';

  constructor(private http: HttpClient) {}

  getAll(customerId?: number): Observable<LabResult[]> {
    const params: Record<string, string> = {};
    if (customerId) {
      params['customerId'] = customerId.toString();
    }
    return this.http.get<LabResult[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<LabResult> {
    return this.http.get<LabResult>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateLabRequest): Observable<LabResult> {
    return this.http.post<LabResult>(this.apiUrl, request);
  }

  update(id: string, labResult: LabResult): Observable<LabResult> {
    return this.http.put<LabResult>(`${this.apiUrl}/${id}`, labResult);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
