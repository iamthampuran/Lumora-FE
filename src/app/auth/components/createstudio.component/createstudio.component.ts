import { Component, inject, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateStudio } from '../../models/create.studio';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';

type StudioFormGroup = {
  studioName: FormControl<string>;
  description: FormControl<string | null>;
  phoneNumber: FormControl<string>;
  website: FormControl<string | null>;
  latitude: FormControl<number>;
  longitude: FormControl<number>;
  serviceRadiusKm: FormControl<number>;
  minPrice: FormControl<number>;
  maxPrice: FormControl<number>;
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
    latitude: new FormControl(0, { nonNullable: true }),
    longitude: new FormControl(0, { nonNullable: true }),
    serviceRadiusKm: new FormControl(0, {
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

  sanitizeDecimalInput(controlName: 'serviceRadiusKm' | 'minPrice' | 'maxPrice', event: Event): void {
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
    this.normalizeStringControl('serviceRadiusKm');
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
      serviceRadiusKm: payload.serviceRadiusKm,
      minPrice: payload.minPrice,
      maxPrice: payload.maxPrice,
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
      (position) => {
        this.formGroup.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
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
}
