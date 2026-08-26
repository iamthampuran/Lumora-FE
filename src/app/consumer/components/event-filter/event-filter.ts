import { CommonModule } from '@angular/common';
import { Component, output, signal, inject, OnInit, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EventFilterPayload } from '../../../shared/models/event-filter';
import { EventType } from '../../../shared/models/event-types';
import { LookupService } from '../../../shared/services/lookup.service';

@Component({
  selector: 'app-event-filter',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-filter.html',
  styleUrl: './event-filter.css',
})
export class EventFilter implements OnInit {
  readonly closePanel = output<void>();
  readonly applyFilters = output<EventFilterPayload>();
  
  readonly isClosing = input<boolean>(false);
  // NEW: Accept the currently active filters to restore state
  readonly initialFilters = input<EventFilterPayload | null>(null);

  private lookupService = inject(LookupService);
  eventTypes = signal<EventType[]>([]);

  // Update dates to be strings so the <input type="date"> can read them
  filterForm = new FormGroup({
    eventTypeIds: new FormControl<string[]>([]),
    startDate: new FormControl<string | null>(null),
    endDate: new FormControl<string | null>(null),
    minPrice: new FormControl<number | null>(null),
    maxPrice: new FormControl<number | null>(null),
  });

  activeDatePreset = signal<'thisMonth' | 'nextMonth' | 'custom' | null>(null);

  ngOnInit() {
    this.lookupService.getEventTypes().subscribe(types => this.eventTypes.set(types));

    // Restore previously applied filters if they exist
    const init = this.initialFilters();
    if (init) {
      this.filterForm.patchValue({
        eventTypeIds: init.eventTypes || [],
        startDate: init.fromDate ? this.formatDateForInput(init.fromDate) : null,
        endDate: init.toDate ? this.formatDateForInput(init.toDate) : null,
        minPrice: init.minBudget,
        maxPrice: init.maxBudget
      });
    }
  }

  toggleEventType(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentValues = this.filterForm.controls.eventTypeIds.value || [];

    if (isChecked) {
      this.filterForm.controls.eventTypeIds.setValue([...currentValues, id]);
    } else {
      this.filterForm.controls.eventTypeIds.setValue(currentValues.filter(val => val !== id));
    }
  }

  isEventTypeSelected(id: string): boolean {
    const currentValues = this.filterForm.controls.eventTypeIds.value || [];
    return currentValues.includes(id);
  }

  setDatePreset(preset: 'thisMonth' | 'nextMonth' | 'custom') {
    this.activeDatePreset.set(preset);

    const today = new Date();
    if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      this.filterForm.patchValue({
        startDate: this.formatDateForInput(firstDay),
        endDate: this.formatDateForInput(lastDay)
      });
    } else if (preset === 'nextMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      this.filterForm.patchValue({
        startDate: this.formatDateForInput(firstDay),
        endDate: this.formatDateForInput(lastDay)
      });
    } else {
      this.filterForm.patchValue({ startDate: null, endDate: null });
    }
  }

  onClearAll() {
    this.filterForm.reset();
    this.filterForm.controls.eventTypeIds.setValue([]);
    this.activeDatePreset.set(null);
  }

  onApply() {
    const raw = this.filterForm.getRawValue();
    this.applyFilters.emit({
      eventTypes: raw.eventTypeIds && raw.eventTypeIds.length > 0 ? raw.eventTypeIds : null,
      // Convert string values back to proper Date objects for the Payload/Service
      fromDate: raw.startDate ? new Date(raw.startDate) : null,
      toDate: raw.endDate ? new Date(raw.endDate) : null,
      minBudget: raw.minPrice,
      maxBudget: raw.maxPrice
    });
  }

  // Helper method to format Dates to YYYY-MM-DD exactly how HTML inputs expect
  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}