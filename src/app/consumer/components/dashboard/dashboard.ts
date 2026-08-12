import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ConsumerService } from '../../services/consumer.service';
import { ConsumerSidebar } from '../sidebar/sidebar';
import { ConsumerTopbar } from '../topbar/topbar';
import { ConsumerRecentActivity } from '../recent-activity/recent-activity';
import { EventTabs } from "../event-tabs/event-tabs";
import { EventStatus } from '../../enums/event.status.enum';
import { DashboardStatsRow } from '../stats-row/stats-row';
import { AuthService } from '../../../auth/services/auth.service';
import { EventDashboard } from '../../models/event-dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [ConsumerSidebar, ConsumerTopbar, ConsumerRecentActivity, EventTabs, DashboardStatsRow],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  consumerService = inject(ConsumerService);
  authService = inject(AuthService);
  pageSize = signal(10);
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
    return data?.eventDetails ?? [];
  })

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
