import { Component, signal, effect, viewChild, inject, ElementRef, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EventType } from '../../../shared/models/event-types';
import { LookupService } from '../../../shared/services/lookup.service';
import { Tag } from '../../../shared/models/tags';
import { AuthService } from '../../../auth/services/auth.service';
import { ConsumerService } from '../../services/consumer.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-create-event',
  imports: [ReactiveFormsModule, NgClass, LoaderComponent],
  templateUrl: './create-event.html',
  styleUrl: './create-event.css',
})
export class CreateEvent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private lookupService = inject(LookupService);
  private authService = inject(AuthService);
  private consumerService = inject(ConsumerService);
  private snackBar = inject(MatSnackBar);
  private readonly otherCategoryValue = 'Other';

  // MODERN ANGULAR 22: Signal-based ViewChild
  mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  // Navigation & Location State
  markerPosition = signal<{ lat: number; lng: number } | null>(null);
  currentStep = signal<number>(1);
  isLoading = signal<boolean>(false);
  private pendingRequests = 0;
  eventTypes = signal<EventType[]>([]);
  tags = signal<Tag[]>([]);

  // Reactive Form Setup with Nested Groups per step
  eventForm: FormGroup = this.fb.group({
    basics: this.fb.group({
      title: ['', Validators.required],
      categoryId: [null as string | null, Validators.required],
      customCategory: [null as string | null],
      date: ['', Validators.required],
      duration: [null as number | null, [Validators.required, Validators.min(0.25)]],
      budget: [null, [Validators.required, Validators.min(1000)]],
    }),
    location: this.fb.group({
      venue: ['', Validators.required],
      latitude: [null as number | null, Validators.required],
      longitude: [null as number | null, Validators.required],
    }),
    style: this.fb.group({
      tags: [[], [Validators.required, Validators.minLength(1)]],
      specialRequirements: ['', [Validators.maxLength(500)]],
    }),
  });

  // Tag Management State

  constructor() {
    // MODERN ANGULAR 22: effect() reacts automatically when the element enters the DOM
    effect(() => {
      const container = this.mapContainer();

      // Step 2 is conditionally rendered, so the container is created/destroyed on step changes.
      // Recreate and dispose the map along with that lifecycle to avoid stale DOM references.
      if (!container) {
        if (this.map) {
          this.map.remove();
          this.map = null;
          this.marker = null;
        }
        return;
      }

      const containerEl = container.nativeElement;

      // Leaflet needs a tiny delay to ensure the container has final dimensions.
      setTimeout(() => {
        const latestContainer = this.mapContainer()?.nativeElement;
        if (latestContainer !== containerEl) {
          return;
        }

        if (!this.map) {
          this.initMap(containerEl);
        } else {
          this.map.invalidateSize();
        }
      }, 50);
    });
  }

  ngOnInit(): void {
    this.getCategories();
    this.getTags();
    console.log('Categories fetched:', this.eventTypes());
  }

  isOtherCategorySelected(): boolean {
    return this.eventForm.get('basics.categoryId')?.value === this.otherCategoryValue;
  }

  private initMap(containerEl: HTMLDivElement) {
    // 1. Initialize the map centered on a default location (e.g., Ernakulam)
    this.map = L.map(containerEl).setView([9.9816, 76.2999], 13);

    // 2. Add free OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // 3. Fix default marker icon paths (Common Leaflet + Angular bundler issue)
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    // 4. Add the GeoSearch (Autocomplete) Control
    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false, // We handle the marker manually
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Search for a venue or city...',
      keepResult: true,
    });
    this.map.addControl(searchControl);

    // 5. Handle user clicking the map to drop a pin
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng, 'Selected on Map', icon);
    });

    // 6. Handle user searching and selecting a location from the search bar
    this.map.on('geosearch/showlocation', (e: any) => {
      this.updateLocation(e.location.y, e.location.x, e.location.label, icon);
    });

    // Restore previously selected location when returning to Step 2.
    this.restoreSavedLocation(icon);
  }

  private restoreSavedLocation(icon: L.Icon) {
    const lat = this.eventForm.get('location.latitude')?.value as number | null;
    const lng = this.eventForm.get('location.longitude')?.value as number | null;
    const venue = (this.eventForm.get('location.venue')?.value as string | null) ?? 'Selected location';

    if (lat == null || lng == null) {
      return;
    }

    this.updateLocation(lat, lng, venue, icon);
    this.map?.setView([lat, lng], 13);
  }

  private updateLocation(lat: number, lng: number, venueName: string, icon: L.Icon) {
    if (!this.map) {
      return;
    }

    // Update marker on map
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
    }

    // Update Signals & Form
    this.markerPosition.set({ lat, lng });
    this.eventForm.get('location')?.patchValue({
      venue: venueName,
      latitude: lat,
      longitude: lng,
    });
  }

  get durationTimeStr(): string {
    const val = this.eventForm.get('basics.duration')?.value;
    if (!val) return '00:00';

    const hours = Math.floor(val);
    const minutes = Math.round((val - hours) * 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // ADD THIS: Handler to parse time string back to decimal and enforce 15-min rounding
  onDurationChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const [hoursStr, minutesStr] = input.value.split(':');
      let hours = parseInt(hoursStr, 10);
      let minutes = parseInt(minutesStr, 10);

      // Force 15-minute increments just in case the browser bypasses the step attribute
      let roundedMinutes = Math.round(minutes / 15) * 15;

      // Handle edge case where rounding pushes minutes to 60
      if (roundedMinutes === 60) {
        hours += 1;
        roundedMinutes = 0;
      }

      // Convert to decimal (e.g., 4 hrs 15 mins = 4.25)
      const decimalDuration = hours + roundedMinutes / 60;
      this.eventForm.get('basics.duration')?.setValue(decimalDuration);

      // Update the input field visually to reflect any rounding
      input.value = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
    } else {
      this.eventForm.get('basics.duration')?.setValue(null);
    }
  }

  get formattedDuration(): string {
    const val = this.eventForm.get('basics.duration')?.value;
    if (!val) return 'Not specified';

    const hours = Math.floor(val);
    const minutes = Math.round((val - hours) * 60);

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}mins`;
  }

  // Getter for Special Requirements character counter
  get specialRequirementsCount(): number {
    return this.eventForm.get('style.specialRequirements')?.value?.length || 0;
  }

  // Form Validation Helper
  canGoNext(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.eventForm.get('basics')?.valid ?? false;
      case 2:
        return this.eventForm.get('location')?.valid ?? false;
      case 3:
        return (this.eventForm.get('style.tags')?.value?.length ?? 0) > 0;
      default:
        return true;
    }
  }

  // Navigation Methods
  nextStep() {
    // Force touch all controls in the current step to show errors if they bypassed the disabled button somehow
    this.markCurrentStepTouched();

    if (this.canGoNext() && this.currentStep() < 4) {
      this.currentStep.update((s) => s + 1);
      window.scrollTo(0, 0);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
      window.scrollTo(0, 0);
    }
  }

  goToStep(step: number) {
    this.currentStep.set(step);
  }

  private markCurrentStepTouched() {
    if (this.currentStep() === 1) this.eventForm.get('basics')?.markAllAsTouched();
    if (this.currentStep() === 2) this.eventForm.get('location')?.markAllAsTouched();
  }

  // Tag Methods interacting with the FormControl
  get currentTags(): string[] {
    return this.eventForm.get('style.tags')?.value || [];
  }

  get selectedTags(): Tag[] {
    const selectedTagIds = this.currentTags;
    return this.tags().filter((tag) => selectedTagIds.includes(tag.id));
  }

  isTagSelected(tagId: string): boolean {
    return this.currentTags.includes(tagId);
  }

  getTagNameById(tagId: string): string {
    return this.tags().find((tag) => tag.id === tagId)?.name ?? tagId;
  }

  removeTag(tagIdToRemove: string) {
    const updatedTags = this.currentTags.filter((tagId) => tagId !== tagIdToRemove);
    this.eventForm.get('style.tags')?.setValue(updatedTags);
  }

  addTag(tagId: string) {
    if (!this.currentTags.includes(tagId)) {
      this.eventForm.get('style.tags')?.setValue([...this.currentTags, tagId]);
    }
  }

  // Helper for UI Error styling
  isInvalid(controlPath: string): boolean {
    const control = this.eventForm.get(controlPath);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get categoryDisplayValue(): string {
    const selectedCategoryId = this.eventForm.get('basics.categoryId')?.value;

    if (selectedCategoryId !== this.otherCategoryValue) {
      // Find the matching name from the API results for the review step
      const category = this.eventTypes().find((c) => c.id === selectedCategoryId);
      return category ? category.name : 'Not specified';
    }

    const customCategory = this.eventForm.get('basics.customCategory')?.value?.trim();
    return customCategory || 'Other';
  }

  onCategoryChange() {
    const customCategoryControl = this.eventForm.get('basics.customCategory');
    if (!customCategoryControl) return;

    if (this.isOtherCategorySelected()) {
      customCategoryControl.setValidators([Validators.required]);
    } else {
      customCategoryControl.clearValidators();
      // Nullify the custom category if a standard API category is chosen
      customCategoryControl.setValue(null);
    }
    customCategoryControl.updateValueAndValidity();
  }

  submitEvent() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;

      // Prepare the exact payload you described
      let finalCategoryId = formValue.basics.categoryId;
      let finalCustomCategory = formValue.basics.customCategory;

      // If 'Other' is selected, set categoryId to null
      if (finalCategoryId === this.otherCategoryValue) {
        finalCategoryId = null;
      } else {
        // Just an extra safety net, onCategoryChange already handles this
        finalCustomCategory = null;
      }

      const consumerId = this.authService.getRoleScopedProfileId();
      if (!consumerId){
        this.snackBar.open('Could not create event. Consumer profile not found.', 'Close', {
          duration: 3500,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
        console.error('Consumer ID not found');
        return;
      }

      const commandPayload = {
        title: formValue.basics.title,
        eventCategoryId: finalCategoryId,
        customEventCategory: finalCustomCategory,
        eventDate: formValue.basics.date,
        budget: formValue.basics.budget,
        location: {
          latitude: formValue.location.latitude,
          longitude: formValue.location.longitude,
        },
        duration: formValue.basics.duration,
        tagIds: formValue.style.tags,
        consumerId: consumerId,
        specialRequirements: formValue.style.specialRequirements || null,
      };

      console.log('Event Created Successfully! Payload:', commandPayload);
      this.startLoading();
      this.consumerService.createEvent(consumerId, commandPayload)
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: () => {
          this.snackBar.open('Event created successfully.', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          void this.router.navigate(['/consumer/dashboard']);
        },
        error: (error) => {
          const apiMessage = error?.error?.message;
          const message = typeof apiMessage === 'string' && apiMessage.trim().length > 0
            ? apiMessage
            : 'Failed to create event. Please try again.';
          this.snackBar.open(message, 'Close', {
            duration: 4500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          console.error('Error creating event:', error);
        },
      });

    }
  }

  getCategories() {
    this.startLoading();
    this.lookupService.getEventTypes()
    .pipe(finalize(() => this.stopLoading()))
    .subscribe({
      next: (types) => {
        this.eventTypes.set(types);
        console.log('Fetched Event Types:', types);
      },
    });
  }

  getTags() {
    this.startLoading();
    this.lookupService.getTags()
    .pipe(finalize(() => this.stopLoading()))
    .subscribe({
      next: (tags) => {
        this.tags.set(tags);
        console.log('Fetched Tags:', tags);
      },
    });
  }

  private startLoading(): void {
    this.pendingRequests += 1;
    this.isLoading.set(true);
  }

  private stopLoading(): void {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    this.isLoading.set(this.pendingRequests > 0);
  }

  cancelClicked() {
    this.router.navigate(['/consumer/dashboard']);
  }
}
