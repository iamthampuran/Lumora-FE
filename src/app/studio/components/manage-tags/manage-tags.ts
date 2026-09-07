import { Component, input, inject, OnInit, output } from '@angular/core';
import { Tag } from '../../../shared/models/tags';
import { LookupService } from '../../../shared/services/lookup.service';
import { StudioService } from '../../services/studio.service';
import { UpdateStudioTagsPayload } from '../../models/studio-profile-model';
import { signal, computed } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-tags',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-tags.html',
  styleUrl: './manage-tags.css',
})
export class ManageTags implements OnInit {
  isModal = input<boolean>(false);
  initialTags = input<Tag[]>([]); 
  
  close = output<void>();
  saved = output<void>();

  private lookupService = inject(LookupService);
  private studioService = inject(StudioService);
  private authService = inject(AuthService);

  // State
  availableTags = signal<Tag[]>([]);
  selectedTags = signal<Tag[]>([]);
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  readonly MAX_TAGS = 20;

  ngOnInit() {
    this.selectedTags.set([...this.initialTags()]);
    this.fetchTags();
  }

  fetchTags() {
    this.isLoading.set(true);
    this.lookupService.getTags()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (tags: Tag[]) => {
          // Merge fetched tags with any initial custom tags that might not be in the lookup yet
          const allTags = [...tags];
          
          this.initialTags().forEach(initial => {
            if (!allTags.some(t => t.id === initial.id)) {
              allTags.unshift(initial);
            }
          });
          this.availableTags.set(allTags);
        },
        error: (err) => console.error('Failed to fetch tags', err)
      });
  }

  // Computed Properties
  filteredTags = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.availableTags();
    return this.availableTags().filter(tag => tag.name.toLowerCase().includes(query));
  });

  exactMatchExists = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.availableTags().some(tag => tag.name.toLowerCase() === query);
  });

  showCreateOption = computed(() => {
    return this.searchQuery().trim().length > 0 && !this.exactMatchExists();
  });

  // Actions
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTags().some(t => t.id === tagId);
  }

  toggleTag(tag: Tag) {
    const current = this.selectedTags();
    const isSelected = current.some(t => t.id === tag.id);

    if (isSelected) {
      this.selectedTags.set(current.filter(t => t.id !== tag.id));
    } else {
      if (current.length >= this.MAX_TAGS) return; // Enforce limit
      this.selectedTags.set([...current, tag]);
    }
  }

  removeTag(tagId: string) {
    this.selectedTags.set(this.selectedTags().filter(t => t.id !== tagId));
  }

  createAndSelectTag() {
    const query = this.searchQuery().trim();
    if (!query || this.exactMatchExists() || this.selectedTags().length >= this.MAX_TAGS) return;

    // Create a temporary ID for the frontend tracking
    const newTag: Tag = {
      id: `temp_${Date.now()}`,
      name: query
    };

    // Add to available so it renders in the left list, and select it
    this.availableTags.set([newTag, ...this.availableTags()]);
    this.selectedTags.set([...this.selectedTags(), newTag]);
    
    // Clear search
    this.searchQuery.set('');
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
    const studioId = this.authService.getRoleScopedProfileId();
    if (!studioId) return;

    this.isSaving.set(true);

    const payload: UpdateStudioTagsPayload = {
      studioId,
      // Valid UUIDs from predefined tags
      tagIds: this.selectedTags()
        .filter(t => t.id && !t.id.startsWith('temp_'))
        .map(t => t.id),
      // Custom strings to be created by the backend
      customTagDetails: this.selectedTags()
        .filter(t => t.id && t.id.startsWith('temp_'))
        .map(t => t.name)
    };

    this.studioService.addStudioTags(studioId, payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.saved.emit();
        },
        error: (err) => {
          if (err.status === 200 || err.status === 204) {
            this.saved.emit();
            return;
          }
          console.error('Failed to save tags', err);
        }
      });
  }
}
