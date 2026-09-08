import { inject, Service } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { Observable } from 'rxjs';
import { StudioProfileModel, UpdateStudioTagsPayload } from '../models/studio-profile-model';
import { environment } from '../../../environments/environment';
import { ProfileCompletionResult } from '../models/profile-completion';

@Service()
export class StudioService {
  private readonly baseUrl = `${environment.apiUrl}/studio`;
  protected baseService = inject(BaseService);

  getStudioDetails(studioId: string): Observable<StudioProfileModel> {
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

  addPortfolioImage(studioId: string, file: File, title: string, order: number): Observable<any> {
    const url = `${this.baseUrl}/${studioId}/add-portfolio-images`;
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (title) formData.append('title', title);
    formData.append('order', order.toString());
    return this.baseService.post(url, formData);
  }

  updatePortfolioImage(
    imageId: string,
    title: string | null,
    order: number,
    file?: File,
    isDeleted: boolean = false
  ): Observable<any> {
    const url = `${this.baseUrl}/update-portfolio-image/${imageId}`;
    const formData = new FormData();
    // If a file is provided, we are replacing the image. If not, we are just updating title/order.
    if (file) formData.append('file', file, file.name);
    if (title) formData.append('title', title);
    formData.append('order', order.toString());
    formData.append('isDeleted', isDeleted.toString());
    return this.baseService.put(url, formData);
  }

  addStudioTags(studioId : string, payload: UpdateStudioTagsPayload): Observable<any> {
    const url = `${this.baseUrl}/${studioId}/add-studio-tags`;
    return this.baseService.post(url, payload);
  }

  addTeamMembers(studioId: string, payload: any): Observable<any> {
    // Adjust the endpoint URL to match your backend route perfectly
    const url = `${this.baseUrl}/${studioId}/add-employee-details`; 
    return this.baseService.post(url, payload);
  }

}
