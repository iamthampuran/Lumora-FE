import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BaseService } from '../../shared/base-service';
import { Observable } from 'rxjs';
import { EventDashboard } from '../models/event-dashboard';
import { EventStatus } from '../enums/event.status.enum';
import { HttpParams } from '@angular/common/http';
import { InquiryWidget } from '../models/inquiry-widget';
import { EventData } from '../models/event-data';
import { EventFilterPayload } from '../../shared/models/event-filter';

@Injectable({
    providedIn: 'root'
})
export class ConsumerService {
    private readonly baseUrl = `${environment.apiUrl}/consumerprofile`;   
    protected baseService = inject(BaseService);

    getConsumerEventDetails(consumerId: string, eventStatus: EventStatus, pageCount: number, pageSize: number, searchText : string| null = null,  filters: EventFilterPayload | null = null) : 
    Observable<EventDashboard> {
        const baseUrl = `${this.baseUrl}/${consumerId}/dashboard/events`;
        var queryParams = new HttpParams()
            .set('eventStatus', eventStatus.toString())
            .set('pageCount', pageCount.toString())
            .set('pageSize', pageSize.toString());
            
        if (searchText) {
            queryParams = queryParams.set('searchText', searchText);
        }
        if (filters) {
            if (filters.eventTypes && filters.eventTypes.length > 0) {
                filters.eventTypes.forEach(id => {
                    queryParams = queryParams.append('EventTypeIds', id);
                });
            }

            const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
            const toDate = filters.toDate ? new Date(filters.toDate) : null;

            if (fromDate && !Number.isNaN(fromDate.getTime())) {
                queryParams = queryParams.set('StartDate', fromDate.toDateString());
            }
            if (toDate && !Number.isNaN(toDate.getTime())) {
                queryParams = queryParams.set('EndDate', toDate.toDateString());
            }
            if (filters.minBudget !== null && filters.minBudget !== undefined) {
                queryParams = queryParams.set('MinPrice', filters.minBudget.toString());
            }
            if (filters.maxBudget !== null && filters.maxBudget !== undefined) {
                queryParams = queryParams.set('MaxPrice', filters.maxBudget.toString());
            }
        }
        return this.baseService.get(baseUrl, queryParams);
    }
    
    getInquiryWidgetDetails(consumerId: string) : Observable<InquiryWidget[]> {
        const baseUrl = `${this.baseUrl}/${consumerId}/dashboard/inquiries`;
        return this.baseService.get(baseUrl);
    }

    createEvent(id: string, payload: object) : Observable<string> {
        const baseUrl = `${this.baseUrl}/${id}/create/event`;
        return this.baseService.post(baseUrl, payload);
    }

    getEventDetails(eventId: string) : Observable<EventData>{
        const baseUrl = `${this.baseUrl}/event/${eventId}`;
        return this.baseService.get(baseUrl);
    }

}
