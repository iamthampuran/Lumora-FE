import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BaseService } from '../../shared/base-service';
import { UserRole } from '../enums/UserRole';
import { CreateUser } from '../models/create.user';
import { Observable } from 'rxjs';
import { CreateStudio } from '../models/create.studio';
import { CreateConsumer } from '../models/create.consumer';
import { SingInUser } from '../models/signin.user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private readonly platformId = inject(PLATFORM_ID);

    isAuthenticated(): boolean {
        if (!isPlatformBrowser(this.platformId)) return false;
        const token = this.getAccessToken();
        if (!token) return false;

        try {
            const { exp } = JSON.parse(atob(token.split('.')[1]));
            return typeof exp === 'number' && Date.now() < exp * 1000;
        } catch {
            return false;
        }
    }

    storeTokens(accessToken: string, refreshToken: string, persist: boolean): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const expires = persist
            ? `; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}`
            : '';
        document.cookie = `lumora_access_token=${accessToken}; path=/; Secure; SameSite=Strict${expires}`;
        document.cookie = `lumora_refresh_token=${refreshToken}; path=/; Secure; SameSite=Strict${expires}`;
    }

    clearTokens(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        document.cookie = 'lumora_access_token=; path=/; max-age=0';
        document.cookie = 'lumora_refresh_token=; path=/; max-age=0';
    }

    getRole(): UserRole | null {
        const token = this.getAccessToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const raw: string | undefined = payload['role']
                ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            if (!raw) return null;

            switch (raw.toLowerCase()) {
                case 'consumer': return UserRole.Cosnsumer;
                case 'studio':   return UserRole.Studio;
                case 'admin':    return UserRole.Admin;
                default:         return null;
            }
        } catch {
            return null;
        }
    }

    getRoleDashboardPath(): string {
        const role = this.getRole();
        if (role === UserRole.Cosnsumer) return '/consumer/dashboard';
        if (role === UserRole.Studio)   return '/studio';
        return '/login';
    }

    private getAccessToken(): string | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        const match = document.cookie.split(';')
            .find(c => c.trim().startsWith('lumora_access_token='));
        return match ? match.trim().substring('lumora_access_token='.length) : null;
    }
    private readonly baseUrl = `${environment.apiUrl}/auth`;
    protected baseService = inject(BaseService);

    createUser(createUserForm : CreateUser) : Observable<string>{
        const url = `${this.baseUrl}/create/user`;
        return this.baseService.post(url, createUserForm);
    }

    createStudio(createStudioForm: CreateStudio): Observable<string> {
        const url = `${this.baseUrl}/create/studio/${createStudioForm.userId}`;
        return this.baseService.post(url, createStudioForm);
    }

    createConsumer(createConsumerForm: CreateConsumer) : Observable<string>{
        const url = `${this.baseUrl}/create/consumer/${createConsumerForm.userId}`;
        const formData = new FormData();

        formData.append('UserId', createConsumerForm.userId);
        formData.append('FullName', createConsumerForm.fullName);
        formData.append('PhoneNumber', createConsumerForm.phoneNumber);

        if (createConsumerForm.bio !== null) {
            formData.append('Bio', createConsumerForm.bio);
        }

        if (createConsumerForm.formFile !== null) {
            formData.append('formFile', createConsumerForm.formFile, createConsumerForm.formFile.name);
        }

        return this.baseService.post(url, formData);
    }

    uploadConsumerPhoto(consumerId: string, file: File): Observable<string> {
        const url = `${this.baseUrl}/upload/consumer/photo/${consumerId}`;
        const formData = new FormData();
        formData.append('file', file);
        return this.baseService.post(url, formData);
    }

    signInUser(email: string, password: string): Observable<SingInUser> {
        const url = `${this.baseUrl}/signin`;
        const body = { "Email": email, "Password": password };
        return this.baseService.post(url, body);
    }
}
