import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Overlay móvil -->
    @if (mobileOpen()) {
      <div class="fixed inset-0 bg-black/40 z-40 lg:hidden" (click)="mobileOpen.set(false)"></div>
    }

    <aside class="fixed left-0 top-0 h-screen bg-white border-r border-[var(--color-border-light)] flex flex-col z-50 transition-all duration-300"
           [class.w-64]="!collapsed()"
           [class.w-20]="collapsed()"
           [class.-translate-x-full]="!mobileOpen() && isMobile()"
           [class.translate-x-0]="mobileOpen() || !isMobile()">

      <!-- Logo + Toggle -->
      <div class="flex items-center gap-3 px-4 h-16 border-b border-[var(--color-border-light)] shrink-0">
        <button (click)="toggleCollapse()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-[var(--color-arona-500)] border-none bg-transparent cursor-pointer transition-all shrink-0">
          <span class="material-icons-outlined text-xl">{{ collapsed() ? 'menu_open' : 'menu' }}</span>
        </button>
        @if (!collapsed()) {
          <div class="flex items-center gap-2 animate-fade-in">
            <div class="w-7 h-7 bg-[var(--color-arona-500)] rounded-lg flex items-center justify-center shrink-0">
              <span class="material-icons-outlined text-white text-base">eco</span>
            </div>
            <span class="text-lg font-bold text-[var(--color-arona-500)]">Arona</span>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-3">
          @for (item of visibleNavItems(); track item.route) {
            <li>
              <a [routerLink]="item.route"
                 routerLinkActive="bg-[var(--color-arona-500)] text-white shadow-md"
                 #rla="routerLinkActive"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group"
                 [class.text-gray-600]="!rla.isActive"
                 [class.hover:bg-gray-50]="!rla.isActive"
                 [class.hover:text-[var(--color-arona-500)]]="!rla.isActive"
                 [title]="collapsed() ? item.label : ''">
                <span class="material-icons-outlined text-xl transition-colors shrink-0"
                      [class.text-white]="rla.isActive"
                      [class.text-gray-400]="!rla.isActive"
                      [class.group-hover:text-[var(--color-arona-500)]]="!rla.isActive">
                  {{ item.icon }}
                </span>
                @if (!collapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- Bottom Section -->
      <div class="border-t border-[var(--color-border-light)] py-3 px-3 space-y-1">
        <button (click)="onLogout()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer w-full border-none bg-transparent group"
                [title]="collapsed() ? 'Cerrar Sesión' : ''">
          <span class="material-icons-outlined text-xl group-hover:text-red-600 shrink-0">logout</span>
          @if (!collapsed()) {
            <span>Cerrar Sesión</span>
          }
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);
  mobileOpen = signal(false);

  isMobile = signal(window.innerWidth < 1024);

  isAdmin = computed(() => this.authService.userRole() === 'ADMINISTRADOR');

  allNavItems: NavItem[] = [
    { icon: 'home',               label: 'Inicio',       route: '/dashboard' },
    { icon: 'person',             label: 'Mis Datos',    route: '/mis-datos' },
    { icon: 'bar_chart',          label: 'Producción',   route: '/produccion' },
    { icon: 'landscape',          label: 'Mis Campos',   route: '/mis-campos' },
    { icon: 'local_florist',      label: 'Cultivos',     route: '/cultivos' },
    { icon: 'assignment',         label: 'Actividades',  route: '/actividades' },
    { icon: 'bug_report',         label: 'Enfermedades', route: '/enfermedades' },
    { icon: 'verified_user',      label: 'Calidad',      route: '/calidad' },
    { icon: 'admin_panel_settings', label: 'Panel Admin', route: '/panel-admin', adminOnly: true },
  ];

  visibleNavItems = computed(() =>
    this.allNavItems.filter(i => !i.adminOnly || this.isAdmin())
  );

  toggleCollapse(): void {
    if (this.isMobile()) {
      this.mobileOpen.update(v => !v);
    } else {
      this.collapsed.update(v => !v);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
