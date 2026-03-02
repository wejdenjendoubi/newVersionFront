
import { CommonModule, DatePipe, JsonPipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditFilter, AuditLog, EventType, PageResponse, Severity } from 'src/app/models/audit-log';
import { AuditService } from 'src/app/services/audit';


@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.html',
  styleUrls:  ['./audit-list.scss'],
  standalone: true,
  // ✅ Tous les imports nécessaires déclarés ici
  imports: [
    CommonModule,   // ngClass, ngIf legacy (au cas où)
    FormsModule,    // ngModel
    DatePipe,       // | date
    JsonPipe,       // | json
    NgClass         // [ngClass]
  ]
})
export class AuditListComponent implements OnInit {

  // ✅ inject() à la place du constructor
  private auditService = inject(AuditService);

  logs          = signal<AuditLog[]>([]);
  totalElements = signal(0);
  totalPages    = signal(0);
  loading       = signal(false);
  selectedLog   = signal<AuditLog | null>(null);

  filters: AuditFilter = {
    eventType: '',
    severity: '',
    page: 0,
    size: 20
  };

  eventTypes: EventType[] = [
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'CREATE', 'UPDATE', 'DELETE', 'ERROR'
  ];

  severities: Severity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];

  pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i)
  );

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.auditService.getLogs(this.filters).subscribe({
      next: (page: PageResponse<AuditLog>) => {
        this.logs.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.filters.page = 0;
    this.loadLogs();
  }

  resetFilters(): void {
    this.filters = { eventType: '', severity: '', page: 0, size: 20 };
    this.loadLogs();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadLogs();
  }

  openDetail(log: AuditLog): void { this.selectedLog.set(log);   }
  closeDetail(): void             { this.selectedLog.set(null);  }

  getSeverityClass(severity: Severity): string {
    const map: Record<Severity, string> = {
      INFO:     'badge-info',
      WARNING:  'badge-warning',
      ERROR:    'badge-error',
      CRITICAL: 'badge-critical'
    };
    return map[severity] ?? '';
  }

  getEventClass(eventType: EventType): string {
    const map: Record<string, string> = {
      LOGIN:        'event-login',
      LOGOUT:       'event-logout',
      LOGIN_FAILED: 'event-failed',
      CREATE:       'event-create',
      UPDATE:       'event-update',
      DELETE:       'event-delete',
      ERROR:        'event-error'
    };
    return map[eventType] ?? '';
  }

  getEventIcon(eventType: EventType): string {
    const map: Record<string, string> = {
      LOGIN:        '🔑',
      LOGOUT:       '🚪',
      LOGIN_FAILED: '🚫',
      CREATE:       '➕',
      UPDATE:       '✏️',
      DELETE:       '🗑️',
      ERROR:        '❌',
      EXPORT:       '📤',
      IMPORT:       '📥'
    };
    return map[eventType] ?? '📋';
  }
}
