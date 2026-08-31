import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStatus } from '../../enums/event.status.enum';
import { Router } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { ListEventData } from '../list-event-data/list-event-data';
import { EventFilterPayload } from '../../../shared/models/event-filter';
import { EventFilter } from '../event-filter/event-filter';

@Component({
  selector: 'app-list-events',
  imports: [CommonModule, ListEventData, EventFilter],
  templateUrl: './list-events.html',
  styleUrl: './list-events.css',
})
export class ListEvents {
  activeTab = signal<EventStatus>(EventStatus.Created);
  searchQuery = signal<string | null>(null);
  isFilterPanelOpen = signal<boolean>(false);
  isFilterClosing = signal<boolean>(false); // <-- NEW: Tracks the closing animation
  activeFilters = signal<EventFilterPayload | null>(null);

  eventStatus = EventStatus;

  private searchTimeout: any;

  constructor(private router: Router) {}

  openFilterPanel() {
  this.isFilterPanelOpen.set(true);
  this.isFilterClosing.set(false); // Reset the closing state when opening
}

closeFilterPanel() { 
    // Trigger the closing animation first
    this.isFilterClosing.set(true);
    
    // Wait 300ms (matching the CSS duration) before destroying the component
    setTimeout(() => {
      this.isFilterPanelOpen.set(false);
      this.isFilterClosing.set(false);
    }, 300);
  }

applyFilters(filters: EventFilterPayload) {
  this.activeFilters.set(filters);
  this.closeFilterPanel();
}

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