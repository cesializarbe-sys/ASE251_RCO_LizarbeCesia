import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border min-w-[320px] max-w-[420px] animate-slide-in"
             [class]="getClasses(toast.type)">
          <span class="material-icons-outlined text-xl shrink-0">{{ toast.icon }}</span>
          <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
          <button (click)="toastService.dismiss(toast.id)"
            class="w-6 h-6 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity border-none bg-transparent cursor-pointer"
            [class]="getTextClass(toast.type)">
            <span class="material-icons-outlined text-sm">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in { animation: slideIn 0.3s ease-out; }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getClasses(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error':   return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':    return 'bg-blue-50 border-blue-200 text-blue-800';
      default:        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  getTextClass(type: string): string {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error':   return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'info':    return 'text-blue-600';
      default:        return 'text-gray-600';
    }
  }
}
