import { inject, Service } from '@angular/core';
import { BaseService } from '../../shared/base-service';
import { Observable } from 'rxjs';
import { StudioProfileModel } from '../models/studio-profile-model';
import { environment } from '../../../environments/environment';
import { ProfileCompletionResult } from '../models/profile-completion';

@Service()
export class StudioService {
    private readonly baseUrl = `${environment.apiUrl}/studio`;
    protected baseService = inject(BaseService);

    getStudioDetails(studioId: string) : Observable<StudioProfileModel> {
        const url = `${this.baseUrl}/${studioId}`;
        return this.baseService.get(url);
    }

    getProfileCompletionStatus(studioId: string): Observable<ProfileCompletionResult> {
        const url = `${this.baseUrl}/${studioId}/profile-completion`;
        return this.baseService.get(url);
    }

    uploadStudioLogo(studioId: string, file: File): Observable<any> {
        const url = `${this.baseUrl}/${studioId}/update-logo`;
        const formData = new FormData();
        formData.append('formFile', file, file.name);
        return this.baseService.patch(url, formData);
    }

    // Add this right below your uploadStudioLogo method
    uploadStudioCover(studioId: string, file: File): Observable<any> {
        // Adjust this URL to match your exact backend endpoint for Cover Images
        const url = `${this.baseUrl}/${studioId}/update-cover`; 
        const formData = new FormData();
        formData.append('formFile', file, file.name);
        return this.baseService.patch(url, formData);
    }

}
