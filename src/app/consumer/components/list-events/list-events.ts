import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStatus } from '../../enums/event.status.enum';
import { Router } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { ListEventData } from '../list-event-data/list-event-data';

@Component({
  selector: 'app-list-events',
  imports: [CommonModule, ListEventData],
  templateUrl: './list-events.html',
  styleUrl: './list-events.css',
})
export class ListEvents {
  activeTab = signal<EventStatus>(EventStatus.Created);
  searchQuery = signal<string | null>(null);
  eventStatus = EventStatus;

  private searchTimeout: any;

  constructor(private router: Router) {}

  setTab(tab: EventStatus) {
    this.activeTab.set(tab);
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchQuery.set(input.value.trim() || null);
    }, 400);
  }

  goToCreateEvent() {
    this.router.navigate(['/consumer/events/create']);
  }
}