import { inject, Injectable, Service } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from '../../../environments/environment';
import { EventType } from '../models/event-types';
import { Observable } from 'rxjs';
import { Tag } from '../models/tags';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class LookupService {
    baseService = inject(BaseService);
    readonly baseUrl = `${environment.apiUrl}/lookup`;

    getEventTypes(includeOnlyPredefined: boolean = true) : Observable<EventType[]> {
        const url = `${this.baseUrl}/event-types`;
        const params = new HttpParams().set('includeOnlyPredefined', includeOnlyPredefined.toString());
        return this.baseService.get(url, params);
    }

    getTags() : Observable<Tag[]> {
        const url = `${this.baseUrl}/tags`;
        return this.baseService.get(url);
    }
}
