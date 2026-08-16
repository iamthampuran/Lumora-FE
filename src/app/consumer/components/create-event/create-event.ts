import { Component, signal, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-create-event',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './create-event.html',
  styleUrl: './create-event.css',
})
export class CreateEvent {
  private fb = inject(FormBuilder);
  private readonly otherCategoryValue = 'Other';

  // Navigation State
  currentStep = signal<number>(1);

  // Reactive Form Setup with Nested Groups per step
  eventForm: FormGroup = this.fb.group({
    basics: this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      customCategory: [''],
      date: ['', Validators.required],
      duration: ['', Validators.required],
      budget: [null, [Validators.required, Validators.min(1000)]]
    }),
    location: this.fb.group({
      venue: ['', Validators.required]
    }),
    style: this.fb.group({
      tags: [['#cinematic', '#documentary', '#moody'], Validators.required]
    })
  });
  
  // Tag Management State
  suggestedTags = ['#candid', '#traditional', '#editorial', '#film', '#drone', '#corporate', '#wedding'];
  customTagInput = signal<string>('');

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
}
