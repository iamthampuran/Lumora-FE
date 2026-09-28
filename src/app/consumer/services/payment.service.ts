import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BaseService } from '../../shared/services/base.service';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { PaymentDetails } from '../models/payment-details';

@Service()
export class PaymentService {
    private readonly baseUrl = `${environment.apiUrl}/payment`;
  private baseService = inject(BaseService);
  private hubConnection: signalR.HubConnection | undefined;

  public paymentConfirmed$ = new Subject<any>();
  public paymentFailed$ = new Subject<any>();

  initiatePayment(inquiryId: string): Observable<PaymentDetails> {
    return this.baseService.post(`${this.baseUrl}/generate-qr`, { inquiryId });
  }

  startSignalRConnection(inquiryId: string): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace(/\/api$/, '')}/hubs/payment`, {
        // Automatically inject the JWT token for the authorized hub
        accessTokenFactory: () => {
          const authData = localStorage.getItem('auth_data');
          if (authData) {
            const parsed = JSON.parse(authData);
            return parsed.accessToken || '';
          }
          return '';
        }
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connected.');
        this.hubConnection?.invoke('JoinInquiryGroup', inquiryId);
      })
      .catch(err => console.error('SignalR connection error: ', err));

    this.hubConnection.on('PaymentConfirmed', (data) => {
      this.paymentConfirmed$.next(data);
    });

    this.hubConnection.on('PaymentFailed', (data) => {
      this.paymentFailed$.next(data);
    });
  }

  stopSignalRConnection(inquiryId: string): void {
    if (this.hubConnection) {
      this.hubConnection.invoke('LeaveInquiryGroup', inquiryId)
        .then(() => this.hubConnection?.stop())
        .catch(err => console.error('SignalR disconnect error: ', err));
    }
  }
}
