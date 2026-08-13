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
        const payload = this.getTokenPayload();
        if (!payload) return false;

        const expRaw = payload['exp'];
        const exp = typeof expRaw === 'number' ? expRaw : Number(expRaw);
        return Number.isFinite(exp) && Date.now() < exp * 1000;
    }

    storeTokens(accessToken: string, refreshToken: string, persist: boolean): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const isHttps = window.location.protocol === 'https:';
        const securityFlags = isHttps ? '; Secure; SameSite=Strict' : '; SameSite=Lax';

        const expires = persist
            ? `; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}`
            : '';
        document.cookie = `lumora_access_token=${accessToken}; path=/${securityFlags}${expires}`;
        document.cookie = `lumora_refresh_token=${refreshToken}; path=/${securityFlags}${expires}`;
    }

    clearTokens(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        document.cookie = 'lumora_access_token=; path=/; max-age=0';
        document.cookie = 'lumora_refresh_token=; path=/; max-age=0';
    }

    getRole(): UserRole | null {
        const payload = this.getTokenPayload();
        if (!payload) return null;

        const raw = this.getStringClaim(payload, [
            'role',
            'roles',
            'Role',
            'Roles',
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/Role',
        ]);

        if (!raw) return null;

        const normalizedRole = raw.trim().toLowerCase();

        if (normalizedRole.includes('consumer')) return UserRole.Cosnsumer;
        if (normalizedRole.includes('studio')) return UserRole.Studio;
        if (normalizedRole.includes('admin')) return UserRole.Admin;

        return null;
    }

    getRoleScopedProfileId(): string | null {
        const role = this.getRole();
        const payload = this.getTokenPayload();
        if (role === null || !payload) return null;

        if (role === UserRole.Cosnsumer) {
            return payload['consumerId']
                ?? payload['consumerid']
                ?? payload['consumer_id']
                ?? payload['ConsumerId']
                ?? null;
        }

        if (role === UserRole.Studio) {
            return payload['studioId']
                ?? payload['studioid']
                ?? payload['studio_id']
                ?? payload['StudioId']
                ?? null;
        }

        return null;
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

    private getTokenPayload(): Record<string, any> | null {
        const token = this.getAccessToken();
        if (!token) return null;

        try {
            const payloadSegment = token.split('.')[1];
            if (!payloadSegment) return null;

            const decodedPayload = this.decodeBase64Url(payloadSegment);
            return JSON.parse(decodedPayload);
        } catch {
            return null;
        }
    }

    private decodeBase64Url(value: string): string {
        const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        return atob(base64 + padding);
    }

    private getStringClaim(payload: Record<string, any>, claimKeys: string[]): string | null {
        for (const key of claimKeys) {
            const claimValue = payload[key];

            if (typeof claimValue === 'string' && claimValue.trim().length > 0) {
                return claimValue;
            }

            if (Array.isArray(claimValue) && typeof claimValue[0] === 'string') {
                return claimValue[0];
            }
        }

        return null;
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

    logoutUser() : Observable<number> {
        var payload = this.getTokenPayload();
        if (!payload || payload == null) {
            console.error('User is not authenticated');
        }
        var userId = payload?.["nameid"]
        const url = `${this.baseUrl}/logout/${userId}`;
        return this.baseService.delete(url);
    }

    getUserDetailsFromToken(key: string): any {
        const payload = this.getTokenPayload();
        return payload ? payload[key] : null;
    }
}
