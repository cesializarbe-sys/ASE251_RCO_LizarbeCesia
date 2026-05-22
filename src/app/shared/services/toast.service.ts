import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toasts = signal<Toast[]>([]);

  private show(type: Toast['type'], message: string, icon: string, duration = 4000): void {
    const id = ++this.counter;
    this.toasts.update(t => [...t, { id, type, message, icon }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void { this.show('success', message, 'check_circle'); }
  error(message: string): void { this.show('error', message, 'error', 6000); }
  warning(message: string): void { this.show('warning', message, 'warning_amber', 5000); }
  info(message: string): void { this.show('info', message, 'info'); }

  dismiss(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
