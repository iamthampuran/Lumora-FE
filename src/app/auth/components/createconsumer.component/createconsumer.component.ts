import { Component, computed, inject, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CreateConsumer } from '../../models/create.consumer';

type ConsumerFormGroup = {
  fullName: FormControl<string>;
  phoneNumber: FormControl<string>;
  photoUrl: FormControl<string | null>;
  bio: FormControl<string | null>;
};

@Component({
  selector: 'app-createconsumer',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './createconsumer.component.html',
  styleUrl: './createconsumer.component.css',
})
export class CreateconsumerComponent {
  @Input() userId: string | null = null;
  readonly completed = output<void>();

  private readonly authService = inject(AuthService);

  readonly isSubmitted = signal(false);
  readonly isCreatingConsumer = signal(false);
  readonly uploadedFileName = signal<string | null>(null);
  readonly uploadedFile = signal<File | null>(null);
  readonly bioText = signal<string>('');
  readonly bioCharacterCount = computed(() => this.bioText().length);

  readonly formGroup = new FormGroup<ConsumerFormGroup>({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{7,15}$/)],
    }),
    photoUrl: new FormControl<string | null>(null),
    bio: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(200)],
    }),
  });

  hasControlError(controlName: keyof ConsumerFormGroup, errorName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty || this.isSubmitted());
  }

  onBioInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.bioText.set(target.value);
    this.formGroup.controls.bio.setValue(target.value);
  }

  sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 15);
    this.formGroup.controls.phoneNumber.setValue(sanitized, { emitEvent: false });
    input.value = sanitized;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name;
      this.uploadedFileName.set(fileName);
      this.uploadedFile.set(file);
      this.formGroup.controls.photoUrl.setValue(fileName);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  private normalizeStringControl(controlName: keyof ConsumerFormGroup): void {
    const control = this.formGroup.controls[controlName];
    const value = control.value;

    if (typeof value !== 'string') {
      return;
    }

    const trimmed = value.trim();

    if ((controlName === 'bio' || controlName === 'photoUrl') && trimmed === '') {
      this.formGroup.controls[controlName].setValue(null as never);
      return;
    }

    this.formGroup.controls[controlName].setValue(trimmed as never);
  }

  private normalizeFormValues(): void {
    this.normalizeStringControl('fullName');
    this.normalizeStringControl('phoneNumber');
    this.normalizeStringControl('photoUrl');
    this.normalizeStringControl('bio');
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.isCreatingConsumer()) {
      return;
    }

    this.normalizeFormValues();

    if (this.userId === null) {
      console.error('User ID is not set. Cannot submit consumer profile.');
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const payload = this.formGroup.getRawValue();

    const createConsumerPayload: CreateConsumer = {
      userId: this.userId,
      fullName: payload.fullName,
      phoneNumber: `+91${payload.phoneNumber}`,
      photoUrl: payload.photoUrl,
      bio: payload.bio,
      formFile: this.uploadedFile(),
    };

    this.isCreatingConsumer.set(true);

    this.authService.createConsumer(createConsumerPayload).subscribe({
      next: (response) => {
        console.log('Consumer profile created successfully: ', response);
        this.isCreatingConsumer.set(false);
        this.completed.emit();
      },
      error: (error) => {
        console.error('Error creating consumer profile: ', error);
        this.isCreatingConsumer.set(false);
      },
    });
  }
}
