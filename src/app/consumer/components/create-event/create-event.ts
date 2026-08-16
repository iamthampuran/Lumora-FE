import { Component, signal, effect, viewChild, inject, ElementRef, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Router } from '@angular/router';
import { EventType } from '../../models/event-types';
import { LookupService } from '../../../shared/services/lookup.service';

@Component({
  selector: 'app-create-event',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './create-event.html',
  styleUrl: './create-event.css',
})
export class CreateEvent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private lookupService = inject(LookupService);
  private readonly otherCategoryValue = 'Other';

  // MODERN ANGULAR 22: Signal-based ViewChild
  mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  
  private map!: L.Map;
  private marker!: L.Marker;

  // Navigation & Location State
  markerPosition = signal<{ lat: number; lng: number } | null>(null);
  currentStep = signal<number>(1);
  eventTypes = signal<EventType[]>([]);

  // Reactive Form Setup with Nested Groups per step
  eventForm: FormGroup = this.fb.group({
    basics: this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      customCategory: [''],
      date: ['', Validators.required],
      duration: [null as number | null, [Validators.required, Validators.min(0.25)]],
      budget: [null, [Validators.required, Validators.min(1000)]]
    }),
    location: this.fb.group({
      venue: ['', Validators.required],
      latitude: [null as number | null, Validators.required],
      longitude: [null as number | null, Validators.required]
    }),
    style: this.fb.group({
      tags: [['#cinematic', '#documentary', '#moody'], Validators.required],
      specialRequirements: ['', [Validators.maxLength(500)]]
    })
  });

  // Tag Management State
  suggestedTags = ['#candid', '#traditional', '#editorial', '#film', '#drone', '#corporate', '#wedding'];
  customTagInput = signal<string>('');

  constructor() {
    // MODERN ANGULAR 22: effect() reacts automatically when the element enters the DOM
    effect(() => {
      const container = this.mapContainer();
      
      // If the container exists (User reached Step 2) and map isn't initialized yet
      if (container && !this.map) {
        // Leaflet needs a tiny delay to ensure the DOM element has its final dimensions calculated
        setTimeout(() => {
          this.initMap(container.nativeElement);
        }, 50);
      }
    });
  }
  ngOnInit(): void {
    this.getCategories();
    console.log('Categories fetched:', this.eventTypes());
  }

  private initMap(containerEl: HTMLDivElement) {
    // 1. Initialize the map centered on a default location (e.g., Ernakulam)
    this.map = L.map(containerEl).setView([9.9816, 76.2999], 13); 

    // 2. Add free OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // 3. Fix default marker icon paths (Common Leaflet + Angular bundler issue)
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
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
      keepResult: true
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
  }

  private updateLocation(lat: number, lng: number, venueName: string, icon: L.Icon) {
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
      longitude: lng
    });
  }

  get durationTimeStr(): string {
    const val = this.eventForm.get('basics.duration')?.value;
    if (!val) return '';
    
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
      const decimalDuration = hours + (roundedMinutes / 60);
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
      case 1: return this.eventForm.get('basics')?.valid ?? false;
      case 2: return this.eventForm.get('location')?.valid ?? false;
      case 3: return (this.eventForm.get('style.tags')?.value?.length ?? 0) > 0;
      default: return true;
    }
  }

  // Navigation Methods
  nextStep() {
    // Force touch all controls in the current step to show errors if they bypassed the disabled button somehow
    this.markCurrentStepTouched();
    
    if (this.canGoNext() && this.currentStep() < 4) {
      this.currentStep.update(s => s + 1);
      window.scrollTo(0, 0);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
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

  removeTag(tagToRemove: string) {
    const updatedTags = this.currentTags.filter(t => t !== tagToRemove);
    this.eventForm.get('style.tags')?.setValue(updatedTags);
  }

  addCustomTag() {
    const val = this.customTagInput().trim();
    if (val) {
      const formattedTag = val.startsWith('#') ? val : `#${val}`;
      this.addTag(formattedTag);
      this.customTagInput.set(''); 
    }
  }

  addTag(tag: string) {
    if (!this.currentTags.includes(tag)) {
      this.eventForm.get('style.tags')?.setValue([...this.currentTags, tag]);
    }
  }

  // Helper for UI Error styling
  isInvalid(controlPath: string): boolean {
    const control = this.eventForm.get(controlPath);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isOtherCategorySelected(): boolean {
    return this.eventForm.get('basics.category')?.value === this.otherCategoryValue;
  }

  get categoryDisplayValue(): string {
    const selectedCategory = this.eventForm.get('basics.category')?.value;
    if (selectedCategory !== this.otherCategoryValue) {
      return selectedCategory || 'Not specified';
    }

    const customCategory = this.eventForm.get('basics.customCategory')?.value?.trim();
    return customCategory || 'Other';
  }

  onCategoryChange() {
    const customCategoryControl = this.eventForm.get('basics.customCategory');
    if (!customCategoryControl) {
      return;
    }

    if (this.isOtherCategorySelected()) {
      customCategoryControl.setValidators([Validators.required]);
    } else {
      customCategoryControl.clearValidators();
      customCategoryControl.setValue('');
    }

    customCategoryControl.updateValueAndValidity();
  }

  submitEvent() {
    if (this.eventForm.valid) {
      console.log('Event Created Successfully!', this.eventForm.value);
      // Call your API service here
    }
  }

  getCategories() {
    this.lookupService.getEventTypes().subscribe({
      next: (types) => {
        this.eventTypes.set(types);
        console.log('Fetched Event Types:', types);
      }
    })
  }

  cancelClicked() {
    this.router.navigate(['/consumer/dashboard']);
  }
}