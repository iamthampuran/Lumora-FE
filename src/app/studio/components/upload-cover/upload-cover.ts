import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, output, signal, viewChild, inject } from '@angular/core';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-upload-cover',
  imports: [CommonModule],
  templateUrl: './upload-cover.html',
  styleUrl: './upload-cover.css',
})
export class UploadCover {
  isModal = input<boolean>(false);
  
  close = output<void>();
  uploaded = output<void>(); 

  private studioService = inject(StudioService);
  private authService = inject(AuthService);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isUploading = signal<boolean>(false);

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

    // Validate size (5MB = 5 * 1024 * 1024 bytes) for Cover Image
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('File is too large. Maximum size is 5MB.');
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

    this.studioService.uploadStudioCover(studioId, file)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: () => {
          this.uploaded.emit();
        },
        error: (err) => {
          if (err.status === 200 || err.status === 204) {
            this.uploaded.emit();
            return;
          }
          console.error('Error uploading cover:', err);
          this.errorMessage.set('Failed to upload cover image. Please try again.');
        }
      });
  }
}
