import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioService } from '../../services/studio.service';
import { AuthService } from '../../../auth/services/auth.service';
import { PortfolioDetails } from '../../models/studio-profile-model';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-upload-portfolio',
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './upload-portfolio.html',
  styleUrl: './upload-portfolio.css',
})
export class UploadPortfolio implements OnInit {
  isModal = input<boolean>(false);
  close = output<void>();
  updated = output<void>();

  private studioService = inject(StudioService);
  private authService = inject(AuthService);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // State
  portfolioItems = signal<PortfolioDetails[]>([]);
  isLoading = signal<boolean>(true);
  isDragging = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Pending File Sub-Dialog State (Adding)
  pendingFile = signal<File | null>(null);
  pendingTitle = signal<string>('');
  pendingOrder = signal<number>(1);

  // Grid Drag & Drop State
  draggedItemIndex = signal<number | null>(null);

  ngOnInit() {
    this.fetchPortfolio();
  }

  fetchPortfolio() {
    const studioId = this.authService.getRoleScopedProfileId();
    if (!studioId) return;

    this.isLoading.set(true);
    this.studioService
      .getStudioDetails(studioId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          // Sort items by order so they appear correctly
          const sorted = (res.portfolioDetails || []).sort((a, b) => a.displayOrder - b.displayOrder);
          this.portfolioItems.set(sorted);
        },
        error: () => console.error('Failed to fetch portfolio'),
      });
  }

  // --- Upload Flow (ADD) ---
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
    if (files && files.length > 0) this.queueFile(files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.queueFile(input.files[0]);
    input.value = ''; // Reset
  }

  triggerFileInput() {
    this.fileInput()?.nativeElement.click();
  }

  queueFile(file: File) {
    this.errorMessage.set(null);
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('File exceeds 10MB limit.');
      return;
    }
    this.pendingFile.set(file);
    this.pendingTitle.set('');
    // Automatically set order to the end of the list
    this.pendingOrder.set(this.portfolioItems().length + 1);
  }

  cancelPendingUpload() {
    this.pendingFile.set(null);
  }

  confirmUpload() {
    const file = this.pendingFile();
    const studioId = this.authService.getRoleScopedProfileId();
    if (!file || !studioId) return;

    this.isUploading.set(true);
    this.studioService
      .addPortfolioImage(studioId, file, this.pendingTitle(), this.pendingOrder())
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: () => {
          this.pendingFile.set(null);
          this.fetchPortfolio();
          this.updated.emit();
        },
        error: (err) => {
          // Ignore JSON parse errors on success
          if (err.status === 200 || err.status === 204) {
            this.pendingFile.set(null);
            this.fetchPortfolio();
            this.updated.emit();
            return;
          }
          this.errorMessage.set('Failed to upload image.');
        },
      });
  }

  // --- Grid Reordering & Inline Updates ---
  onGridDragStart(index: number) {
    this.draggedItemIndex.set(index);
  }

  onGridDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
  }

  onGridDrop(targetIndex: number) {
    const dragIndex = this.draggedItemIndex();
    if (dragIndex === null || dragIndex === targetIndex) return;

    const items = [...this.portfolioItems()];
    const [movedItem] = items.splice(dragIndex, 1);
    items.splice(targetIndex, 0, movedItem);

    items.forEach((item, idx) => {
      const newOrder = idx + 1;
      if (item.displayOrder !== newOrder) {
        item.displayOrder = newOrder; // Optimistic UI update
        this.studioService.updatePortfolioImage(item.id, item.title, newOrder).subscribe({
          next: () => this.updated.emit(),
          error: () => console.error('Failed to update order for', item.id),
        });
      }
    });
    this.portfolioItems.set(items);
    this.draggedItemIndex.set(null);
  }

  updateTitle(item: PortfolioDetails, event: Event) {
    const input = event.target as HTMLInputElement;
    const newTitle = input.value.trim();
    if (item.title === newTitle) return;

    item.title = newTitle; // Optimistic UI update
    this.studioService.updatePortfolioImage(item.id, newTitle, item.displayOrder).subscribe({
      next: () => this.updated.emit(),
      error: () => this.errorMessage.set('Failed to update title.'),
    });
  }

  // --- DELETE FLOW (Using PUT) ---
  deleteItem(item: PortfolioDetails) {
    this.isLoading.set(true);
    // Send undefined for file, and true for isDeleted
    this.studioService.updatePortfolioImage(item.id, item.title, item.displayOrder, undefined, true)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.fetchPortfolio();
          this.updated.emit();
        },
        error: (err) => {
          if (err.status === 200 || err.status === 204) {
            this.fetchPortfolio();
            this.updated.emit();
            return;
          }
          this.errorMessage.set('Failed to delete image.');
        }
      });
  }

  onCancel() {
    this.close.emit();
  }
}