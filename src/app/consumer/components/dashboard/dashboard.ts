import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ConsumerService } from '../../services/consumer.service';
import { ConsumerRecentActivity } from '../recent-activity/recent-activity';
import { EventTabs } from "../event-tabs/event-tabs";
import { EventStatus } from '../../enums/event.status.enum';
import { DashboardStatsRowComponent } from '../stats-row/stats-row';
import { AuthService } from '../../../auth/services/auth.service';
import { EventDashboard } from '../../models/event-dashboard';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [ConsumerRecentActivity, EventTabs, DashboardStatsRowComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  consumerService = inject(ConsumerService);
  authService = inject(AuthService);
  private readonly router = inject(Router);
  pageSize = signal(3);
  pageCount = signal(1);
  consumerId : string = '';//fetch from cookie

  dataFetched = signal<EventDashboard | null>(null);
  readonly stats = computed( () => {
    const data = this.dataFetched();
    return {
      createdCount: data?.createdCount ?? 0,
      completedCount: data?.completedCount ?? 0,
      activeCount: data?.activeCount ?? 0,
    };
  })

  readonly eventsFetched = computed( () => {
    const data = this.dataFetched();
    return data?.eventDetails?.data ?? [];
  })

  createEvent(): void {
    this.router.navigate(['/consumer/events/create']);
  }

  ngOnInit(): void {
    this.consumerId = this.authService.getRoleScopedProfileId() ?? ''; 
    if (!this.consumerId) {
      //show toast error message
      console.error('Consumer ID not found in cookies.');
      return;
    }
    this.getEventDetails(EventStatus.Created);
  }
  getEventDetails(status: EventStatus){
    this.consumerService.getConsumerEventDetails(this.consumerId, status, this.pageCount(), this.pageSize()).subscribe({
      next: (response) => {
        console.log('Event Details:', response);
        this.dataFetched.set(response); // Store the fetched data in the component property
      },
      error: (error) => {
        console.error('Error fetching event details:', error);
      }
    });
  }

}
