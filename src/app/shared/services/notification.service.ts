import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AlertaFitosanitaria } from '../../core/models/alerta-fitosanitaria.model';
import { Subscription, interval, switchMap, startWith } from 'rxjs';

export interface AppNotification {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'PLAGA' | 'ENFERMEDAD' | 'OTRO';
  status: 'PENDIENTE' | 'ATENDIDO';
  isRead: boolean;
  raw: AlertaFitosanitaria;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private pollSub?: Subscription;

  allNotifications = signal<AppNotification[]>([]);
  showPanel = signal(false);
  private readIds = signal<Set<number>>(new Set());

  unreadNotifications = computed(() =>
    this.allNotifications().filter(n => !n.isRead)
  );

  unreadCount = computed(() => this.unreadNotifications().length);

  constructor() {
    this.loadReadIds();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private startPolling(): void {
    this.pollSub = interval(30_000).pipe(
      startWith(0),
      switchMap(() => this.http.get<AlertaFitosanitaria[]>(`${this.apiUrl}/alertas`))
    ).subscribe({
      next: (alertas) => this.processAlertas(alertas),
      error: () => {} // Silently fail on poll errors
    });
  }

  private processAlertas(alertas: AlertaFitosanitaria[]): void {
    const readSet = this.readIds();
    const notifications: AppNotification[] = alertas
      .filter(a => a.estado !== false) // Only active alerts
      .sort((a, b) => (b.idAlerta ?? 0) - (a.idAlerta ?? 0)) // Newest first
      .map(a => ({
        id: a.idAlerta!,
        title: `${a.campo?.nombre ?? 'Campo'} — ${a.tipoProblema}`,
        description: a.descripcionProblema,
        date: a.fechaDeteccion,
        type: a.tipoProblema as AppNotification['type'],
        status: (a.solucionAplicada ? 'ATENDIDO' : 'PENDIENTE') as AppNotification['status'],
        isRead: readSet.has(a.idAlerta!),
        raw: a
      }));
    this.allNotifications.set(notifications);
  }

  markAsRead(id: number): void {
    this.readIds.update(set => { const n = new Set(set); n.add(id); return n; });
    this.allNotifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    this.saveReadIds();
  }

  markAllAsRead(): void {
    const allIds = this.allNotifications().map(n => n.id);
    this.readIds.set(new Set(allIds));
    this.allNotifications.update(list =>
      list.map(n => ({ ...n, isRead: true }))
    );
    this.saveReadIds();
  }

  togglePanel(): void {
    this.showPanel.update(v => !v);
  }

  /** Force refresh (called after creating an alerta) */
  refresh(): void {
    this.http.get<AlertaFitosanitaria[]>(`${this.apiUrl}/alertas`).subscribe({
      next: (alertas) => this.processAlertas(alertas),
      error: () => {}
    });
  }

  private loadReadIds(): void {
    try {
      const raw = localStorage.getItem('arona_read_notifications');
      if (raw) this.readIds.set(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }

  private saveReadIds(): void {
    try {
      localStorage.setItem('arona_read_notifications', JSON.stringify([...this.readIds()]));
    } catch { /* ignore */ }
  }
}
