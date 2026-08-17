import { inject, Injectable, Service } from '@angular/core';
import { BaseService } from '../base-service';
import { environment } from '../../../environments/environment';
import { EventType } from '../models/event-types';
import { Observable } from 'rxjs';
import { Tag } from '../models/tags';

@Injectable({
    providedIn: 'root'
})
export class LookupService {
    baseService = inject(BaseService);
    readonly baseUrl = `${environment.apiUrl}/lookup`;

    getEventTypes() : Observable<EventType[]> {
        const url = `${this.baseUrl}/event-types`;
        return this.baseService.get(url);
    }

    getTags() : Observable<Tag[]> {
        const url = `${this.baseUrl}/tags`;
        return this.baseService.get(url);
    }
}
