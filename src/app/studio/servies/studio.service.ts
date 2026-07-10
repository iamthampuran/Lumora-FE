import { inject, Service } from '@angular/core';
import { BaseService } from '../../shared/base-service';
import { Observable } from 'rxjs';
import { StudioProfileModel } from '../models/studio-profile-model';
import { environment } from '../../../environments/environment';

@Service()
export class StudioService {
    private readonly baseUrl = `${environment.apiUrl}/studio`;
    protected baseService = inject(BaseService);

    getStudioDetails(studioId: string) : Observable<StudioProfileModel> {
        const url = `${this.baseUrl}/${studioId}`;
        return this.baseService.get(url);
    }

}
