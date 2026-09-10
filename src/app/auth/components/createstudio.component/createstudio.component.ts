import { Component, effect, ElementRef, inject, Input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { CreateStudio } from '../../models/create.studio';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';

type GeoSearchShowLocationEvent = {
  location: {
    x: number;
    y: number;
    label: string;
  };
};

type StudioFormGroup = {
  studioName: FormControl<string>;
  description: FormControl<string | null>;
  phoneNumber: FormControl<string>;
  website: FormControl<string | null>;
  locationName: FormControl<string>;
  latitude: FormControl<number>;
  longitude: FormControl<number>;
  serviceRadius: FormControl<number>;
  minPrice: FormControl<number>;
  maxPrice: FormControl<number>;
};

type SelectedStudioLocation = {
  locationName: string;
  latitude: number;
  longitude: number;
};

@Component({
  selector: 'app-createstudio',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './createstudio.component.html',
  styleUrl: './createstudio.component.css',
})
export class CreatestudioComponent {
  readonly isLocating = signal<boolean>(false);
  readonly locationError = signal<string>('');
  readonly isSubmitted = signal(false);
  readonly isCreatingStudio = signal(false);
  readonly loaderComponent = LoaderComponent;
  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  readonly selectedLocation = signal<SelectedStudioLocation | null>(null);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  @Input() userId: string | null = null;
  readonly completed = output<void>();

  authService = inject(AuthService);

  readonly formGroup = new FormGroup<StudioFormGroup>({
    studioName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{7,15}$/)],
    }),
    website: new FormControl<string | null>(null, {
      validators: [Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/)],
    }),
    locationName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    latitude: new FormControl(0, { nonNullable: true }),
    longitude: new FormControl(0, { nonNullable: true }),
    serviceRadius: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)],
    }),
    minPrice: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)],
    }),
    maxPrice: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)],
    }),
  });

  constructor() {
    effect(() => {
      const container = this.mapContainer();
      if (!container) {
        return;
      }

      const containerEl = container.nativeElement;

      setTimeout(() => {
        const latestContainer = this.mapContainer()?.nativeElement;
        if (latestContainer !== containerEl) {
          return;
        }

        if (!this.map) {
          this.initMap(containerEl);
          return;
        }

        this.map.invalidateSize();
      }, 50);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.marker = null;
  }

  hasControlError(controlName: keyof StudioFormGroup, errorName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty || this.isSubmitted());
  }

  sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 15);
    this.formGroup.controls.phoneNumber.setValue(sanitized, { emitEvent: false });
    input.value = sanitized;
  }

  sanitizeDecimalInput(controlName: 'serviceRadius' | 'minPrice' | 'maxPrice', event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');

    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    if (value.includes('.')) {
      const [whole, decimal = ''] = value.split('.');
      value = `${whole}.${decimal.slice(0, 2)}`;
    }

    this.formGroup.controls[controlName].setValue(Number(value), { emitEvent: false });
    input.value = value;
  }

  private isPriceRangeInvalid(): boolean {
    const min = Number(this.formGroup.controls.minPrice.value);
    const max = Number(this.formGroup.controls.maxPrice.value);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      return false;
    }

    return min > max;
  }

  private normalizeStringControl(controlName: keyof StudioFormGroup): void {
    const control = this.formGroup.controls[controlName];
    const value = control.value;

    if (typeof value !== 'string') {
      return;
    }

    const trimmed = value.trim();

    if ((controlName === 'description' || controlName === 'website') && trimmed === '') {
      this.formGroup.controls[controlName].setValue(null as never);
      return;
    }

    this.formGroup.controls[controlName].setValue(trimmed as never);
  }

  private normalizeFormValues(): void {
    this.normalizeStringControl('studioName');
    this.normalizeStringControl('description');
    this.normalizeStringControl('phoneNumber');
    this.normalizeStringControl('website');
    this.normalizeStringControl('locationName');
    this.normalizeStringControl('serviceRadius');
    this.normalizeStringControl('minPrice');
    this.normalizeStringControl('maxPrice');
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.isCreatingStudio()) {
      return;
    }

    this.normalizeFormValues();

    if (this.userId === null) {
      console.error('User ID is not set. Cannot submit studio profile.');
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    if (this.isPriceRangeInvalid()) {
      this.formGroup.controls.maxPrice.setErrors({
        ...(this.formGroup.controls.maxPrice.errors ?? {}),
        range: true,
      });
      this.formGroup.controls.maxPrice.markAsTouched();
      return;
    }

    const payload = {
      ...this.formGroup.getRawValue(),
      phoneNumber: `+91${this.formGroup.controls.phoneNumber.value}`,
    };

    const createStudioPayload: CreateStudio = {
      userId: this.userId,
      phoneNumber: payload.phoneNumber,
      studioName: payload.studioName,
      description: payload.description,
      website: payload.website,
      serviceRadius: payload.serviceRadius,
      minPrice: payload.minPrice,
      maxPrice: payload.maxPrice,
      locationName: payload.locationName,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };

    this.isCreatingStudio.set(true);

    this.authService.createStudio(createStudioPayload).subscribe({
      next: (response) => {
        console.log("Studio profile created successfully: ", response);
        this.isCreatingStudio.set(false);
        this.completed.emit();
      },
      error: (error) => {
        console.error("Error creating studio profile: ", error);
        this.isCreatingStudio.set(false);
      }
    });
  }

  detectLocation(): void {
    this.isLocating.set(true);
    this.locationError.set('');

    if (!navigator.geolocation) {
      this.locationError.set('Geolocation is not supported by your browser.');
      this.isLocating.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationName = await this.getApproximateLocationName(
          position.coords.latitude,
          position.coords.longitude
        );

        this.updateLocation(position.coords.latitude, position.coords.longitude, locationName);
        this.map?.setView([position.coords.latitude, position.coords.longitude], 15);
        this.isLocating.set(false);
      },
      (error) => {
        this.isLocating.set(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError.set('Location request denied. Please allow access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError.set('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            this.locationError.set('The request to get user location timed out.');
            break;
          default:
            this.locationError.set('An unknown error occurred.');
            break;
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  private initMap(containerEl: HTMLDivElement): void {
    this.map = L.map(containerEl).setView([9.9816, 76.2999], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Search for your studio address or city...',
      keepResult: true,
    });
    this.map.addControl(searchControl);

    this.map.on('click', async (event: L.LeafletMouseEvent) => {
      const locationName = await this.getApproximateLocationName(event.latlng.lat, event.latlng.lng);
      this.updateLocation(event.latlng.lat, event.latlng.lng, locationName);
    });

    this.map.on('geosearch/showlocation', (event: unknown) => {
      const locationEvent = event as GeoSearchShowLocationEvent;
      this.updateLocation(locationEvent.location.y, locationEvent.location.x, locationEvent.location.label);
    });

    this.restoreSavedLocation();
  }

  private restoreSavedLocation(): void {
    const lat = this.formGroup.controls.latitude.value;
    const lng = this.formGroup.controls.longitude.value;
    const locationName = this.formGroup.controls.locationName.value || 'Selected studio location';

    if (lat === 0 && lng === 0 && this.formGroup.controls.locationName.value.trim().length === 0) {
      return;
    }

    this.updateLocation(lat, lng, locationName);
    this.map?.setView([lat, lng], 13);
  }

  private updateLocation(lat: number, lng: number, locationName: string): void {
    if (this.map) {
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
      }
    }

    this.locationError.set('');
    this.selectedLocation.set({
      locationName,
      latitude: lat,
      longitude: lng,
    });
    this.formGroup.patchValue({
      locationName,
      latitude: lat,
      longitude: lng,
    });
    this.formGroup.controls.locationName.markAsDirty();
    this.formGroup.controls.latitude.markAsDirty();
    this.formGroup.controls.longitude.markAsDirty();
  }

  private async getApproximateLocationName(lat: number, lng: number): Promise<string> {
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        return `Approx. ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }

      const data = (await response.json()) as { display_name?: string };
      if (typeof data.display_name === 'string' && data.display_name.trim().length > 0) {
        return data.display_name;
      }
    } catch {
      // Fall back to a coordinate label when reverse geocoding fails.
    }

    return `Approx. ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
