import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole } from '../../enums/UserRole';
import { CreateUser } from '../../models/create.user';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';

type SignupFormGroup = {
  role: FormControl<UserRole>;
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-signup-form',
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './signup-form.html',
  styleUrl: './signup-form.css',
})
export class SignupFormComponent {
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  readonly UserRole = UserRole;
  readonly completed = output<{ role: UserRole; email: string; createdUserId: string }>();
  private userCreatedId: string | null = null;

  private authService = inject(AuthService);

  readonly selectedRole = signal<UserRole>(UserRole.Cosnsumer);
  readonly showPassword = signal(false);
  readonly isSubmitted = signal(false);
  readonly isCreatingUser = signal(false);
  

  readonly formGroup = new FormGroup<SignupFormGroup>({
    role: new FormControl<UserRole>(UserRole.Cosnsumer, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(this.passwordPattern),
      ],
    }),
  });

  setRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.formGroup.controls.role.setValue(role);
    this.formGroup.controls.role.markAsTouched();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  hasControlError(controlName: keyof SignupFormGroup, errorName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.hasError(errorName) && (control.touched || control.dirty || this.isSubmitted());
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.isCreatingUser()) {
      return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const payload = this.formGroup.getRawValue();

    const createUserPayload: CreateUser = {
      email: payload.email,
      password: payload.password,
      role: payload.role,
    };

    this.isCreatingUser.set(true);

    this.authService.createUser(createUserPayload).subscribe({
      next: (response) => {
        console.log("User created successfully: ", response);
        this.userCreatedId = response;
        this.completed.emit({
          role: payload.role,
          email: payload.email,
          createdUserId: response,
        });
        this.isCreatingUser.set(false);
      },
      error: (error) => {
        console.error("Error creating user: ", error);
        this.isCreatingUser.set(false);
      }
    });

    console.log('Signup payload', payload);
  }
}
