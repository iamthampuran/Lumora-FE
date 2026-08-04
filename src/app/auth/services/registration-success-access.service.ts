import { inject, Injectable } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class RegistrationSuccessAccessService {
  private readonly storageKey = 'lumora_success_creation_access';
  private readonly platformId = inject(PLATFORM_ID);

  grantAccess(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    sessionStorage.setItem(this.storageKey, '1');
  }

  hasAccess(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return sessionStorage.getItem(this.storageKey) === '1';
  }

  consumeAccess(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    sessionStorage.removeItem(this.storageKey);
  }
}
