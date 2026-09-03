import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { finalize } from 'rxjs';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-upload-logo',
  imports: [CommonModule],
  templateUrl: './upload-logo.html',
  styleUrl: './upload-logo.css',
})
export class UploadLogo {
  isModal = input<boolean>(false);
  
  close = output<void>();
  uploaded = output<void>(); // Emits when the API call is successfully completed

  private studioService = inject(StudioService);
  private authService = inject(AuthService);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isUploading = signal<boolean>(false); // Now handled internally

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  triggerFileInput() {
    this.fileInput()?.nativeElement.click();
  }

  processFile(file: File) {
    this.errorMessage.set(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage.set('Invalid file type. Please upload JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set('File is too large. Maximum size is 2MB.');
      return;
    }

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
    const file = this.selectedFile();
    if (!file) return;

    const studioId = this.authService.getRoleScopedProfileId();
    if (!studioId) {
      this.errorMessage.set('Could not find Studio ID.');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.studioService.uploadStudioLogo(studioId, file)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: () => {
          this.uploaded.emit();
        },
        error: (err : any) => {
          // Handle Angular's JSON parse error on empty 200/204 OK responses
          if (err.status === 200 || err.status === 204) {
            this.uploaded.emit();
            return;
          }
          console.error('Error uploading logo:', err);
          this.errorMessage.set('Failed to upload logo. Please try again.');
        }
      });
  }
}
