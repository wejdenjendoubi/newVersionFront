import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditFilter, AuditLog, PageResponse } from '../models/audit-log';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditService {

  // ✅ inject() à la place du constructor (ESLint Angular 21)
  private http = inject(HttpClient);

  private readonly API = `${environment.apiUrl}/api/audit`;

  getLogs(filters: AuditFilter): Observable<PageResponse<AuditLog>> {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20)
      .set('sort', filters.sort ?? 'createdAt,desc');

    if (filters.eventType) params = params.set('eventType', filters.eventType);
    if (filters.severity)  params = params.set('severity',  filters.severity);
    if (filters.userId)    params = params.set('userId',    filters.userId);
    if (filters.from)      params = params.set('from',      filters.from);
    if (filters.to)        params = params.set('to',        filters.to);

    return this.http.get<PageResponse<AuditLog>>(this.API, { params });
  }

  getByUser(userId: number, page = 0, size = 20): Observable<PageResponse<AuditLog>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<AuditLog>>(
      `${this.API}/user/${userId}`, { params }
    );
  }

  getConnections(userId: number): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.API}/user/${userId}/connections`);
  }

  getById(id: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.API}/${id}`);
  }
}
