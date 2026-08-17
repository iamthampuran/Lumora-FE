import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BaseService } from '../../shared/base-service';
import { Observable } from 'rxjs';
import { EventDashboard } from '../models/event-dashboard';
import { EventStatus } from '../enums/event.status.enum';
import { HttpParams } from '@angular/common/http';
import { InquiryWidget } from '../models/inquiry-widget';

@Injectable({
    providedIn: 'root'
})
export class ConsumerService {
    private readonly baseUrl = `${environment.apiUrl}/consumerprofile`;   
    protected baseService = inject(BaseService);

    getConsumerEventDetails(consumerId: string, eventStatus: EventStatus, pageCount: number, pageSize: number) : Observable<EventDashboard> {
        const baseUrl = `${this.baseUrl}/${consumerId}/dashboard/events`;
        var queryParams = new HttpParams()
            .set('eventStatus', eventStatus.toString())
            .set('pageCount', pageCount.toString())
            .set('pageSize', pageSize.toString());
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

}
