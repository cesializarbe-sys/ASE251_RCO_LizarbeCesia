import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="sticky top-0 z-40 h-16 bg-white border-b border-[var(--color-border-light)] flex items-center justify-between px-6">

      <!-- Search Bar -->
      <div class="relative w-72 md:w-96">
        <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
        <input type="text"
               id="header-search"
               placeholder="Buscar lote, cultivo..."
               class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)] transition-all duration-200" />
      </div>

      <!-- Right Section -->
      <div class="flex items-center gap-4">

        <!-- Notifications -->
        <div class="relative">
          <button id="btn-notifications"
                  (click)="notifService.togglePanel()"
                  class="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[var(--color-arona-500)] transition-all duration-200 border-none bg-transparent cursor-pointer">
            <span class="material-icons-outlined text-xl">notifications</span>
            @if (notifService.unreadCount() > 0) {
              <span class="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold px-0.5 animate-pulse">
                {{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}
              </span>
            }
          </button>

          <!-- Dropdown notificaciones -->
          @if (notifService.showPanel()) {
            <div class="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in overflow-hidden"
                 (click)="$event.stopPropagation()">
              <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-gray-800">Notificaciones</p>
                  @if (notifService.unreadCount() > 0) {
                    <span class="badge badge-warning text-xs">{{ notifService.unreadCount() }} nuevas</span>
                  }
                </div>
                @if (notifService.unreadCount() > 0) {
                  <button (click)="notifService.markAllAsRead()"
                    class="text-xs text-[var(--color-arona-500)] font-semibold hover:underline border-none bg-transparent cursor-pointer">
                    Marcar todo como leído
                  </button>
                }
              </div>
              <div class="max-h-80 overflow-y-auto">
                @for (notif of notifService.allNotifications().slice(0, 15); track notif.id) {
                  <div class="px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer"
                       [class]="notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50'"
                       (click)="notifService.markAsRead(notif.id)">
                    <div class="flex items-start gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                           [class]="getNotifIconBg(notif.type)">
                        <span class="material-icons-outlined text-sm" [class]="getNotifIconColor(notif.type)">
                          {{ getNotifIcon(notif.type) }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="text-xs font-semibold text-gray-800 truncate">{{ notif.title }}</p>
                          @if (!notif.isRead) {
                            <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                          }
                        </div>
                        <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notif.description | slice:0:80 }}{{ notif.description.length > 80 ? '...' : '' }}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-[10px] text-gray-400">📅 {{ notif.date }}</span>
                          <span class="badge text-[10px]" [class]="notif.status === 'ATENDIDO' ? 'badge-success' : 'badge-warning'">
                            {{ notif.status }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                @if (notifService.allNotifications().length === 0) {
                  <div class="px-4 py-10 text-center">
                    <span class="material-icons-outlined text-4xl text-gray-300">notifications_none</span>
                    <p class="text-xs text-gray-400 mt-2">Sin notificaciones</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Help -->
        <button class="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[var(--color-arona-500)] transition-all duration-200 border-none bg-transparent cursor-pointer">
          <span class="material-icons-outlined text-xl">help_outline</span>
        </button>

        <!-- Divider -->
        <div class="w-px h-8 bg-[var(--color-border)]"></div>

        <!-- User Profile -->
        <div class="flex items-center gap-3 cursor-pointer group">
          <div class="w-10 h-10 rounded-full bg-[var(--color-arona-500)] flex items-center justify-center text-white font-bold text-sm group-hover:shadow-md transition-shadow">
            {{ authService.userInitials() }}
          </div>
          <div class="hidden md:block">
            <p class="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
              {{ authService.userName() }}
            </p>
            <p class="text-xs leading-tight">
              <span class="badge text-[10px]"
                    [class]="authService.userRole() === 'ADMINISTRADOR' ? 'badge-info' : 'badge-success'">
                {{ authService.userRole() === 'ADMINISTRADOR' ? 'Administrador' : 'Encargado' }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Cerrar dropdown al hacer click fuera -->
    @if (notifService.showPanel()) {
      <div class="fixed inset-0 z-30" (click)="notifService.showPanel.set(false)"></div>
    }
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  notifService = inject(NotificationService);

  getNotifIcon(type: string): string {
    switch (type) {
      case 'PLAGA': return 'bug_report';
      case 'ENFERMEDAD': return 'local_pharmacy';
      case 'OTRO': return 'warning_amber';
      default: return 'notifications';
    }
  }

  getNotifIconBg(type: string): string {
    switch (type) {
      case 'PLAGA': return 'bg-red-100';
      case 'ENFERMEDAD': return 'bg-orange-100';
      case 'OTRO': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
  }

  getNotifIconColor(type: string): string {
    switch (type) {
      case 'PLAGA': return 'text-red-500';
      case 'ENFERMEDAD': return 'text-orange-500';
      case 'OTRO': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  }
}
