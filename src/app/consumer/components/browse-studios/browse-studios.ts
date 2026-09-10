import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsumerService } from '../../services/consumer.service';
import { EventData } from '../../models/event-data';
import { StudioSortOption } from '../../enums/studio.sort.option';
import { FindStudiosQueryResponse } from '../../models/find-studios';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-browse-studios',
  imports: [CommonModule, LoaderComponent, FormsModule],
  templateUrl: './browse-studios.html',
  styleUrl: './browse-studios.css',
})
export class BrowseStudios implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consumerService = inject(ConsumerService);
  private eRef = inject(ElementRef);

  eventId = signal<string | null>(null);
  eventData = signal<EventData | null>(null);
  studios = signal<FindStudiosQueryResponse[]>([]);
  isLoading = signal<boolean>(true);
  favorites = signal<Set<string>>(new Set());

  // Pagination State
  currentPage = signal<number>(1);
  pageSize = signal<number>(6); // Fixed as per requirements
  totalItems = signal<number>(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  // Search, Sort & Filter State
  searchQuery = signal<string>(''); 
  isSortOpen = signal<boolean>(false);
  isFilterOpen = signal<boolean>(false);
  
  selectedSort = signal<StudioSortOption>(StudioSortOption.Recommended);
  tempDistance = signal<number | null>(null);
  tempRating = signal<number | null>(null);
  appliedDistance = signal<number | null>(null);
  appliedRating = signal<number | null>(null);

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.appliedDistance() !== null) count++;
    if (this.appliedRating() !== null && this.appliedRating()! > 0) count++;
    return count;
  });

  sortOptions = [
    { label: 'Recommended', value: StudioSortOption.Recommended },
    { label: 'Distance (Nearest)', value: StudioSortOption.Nearest },
    { label: 'Highest Rating', value: StudioSortOption.HighestRating },
    { label: 'Name (A - Z)', value: StudioSortOption.NameAscending },
    { label: 'Name (Z - A)', value: StudioSortOption.NameDescending },
    { label: 'Starting Price (Low to High)', value: StudioSortOption.PriceLowToHigh },
    { label: 'Starting Price (High to Low)', value: StudioSortOption.PriceHighToLow }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(id);
      this.fetchEventDetails(id);
      this.loadStudios();
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isSortOpen.set(false);
      this.isFilterOpen.set(false);
    }
  }

  fetchEventDetails(id: string) {
    this.consumerService.getEventDetails(id).subscribe({
      next: (data) => this.eventData.set(data),
      error: (err) => console.error('Failed to load event details', err)
    });
  }

  loadStudios() {
    if (!this.eventId()) return;
    this.isLoading.set(true);

    this.consumerService.getStudioRecommendationsForEvent(
      this.eventId()!,
      this.currentPage(),
      this.pageSize(),
      this.selectedSort(),
      this.appliedDistance(),
      this.appliedRating()
    ).pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (res) => {
        // Handle potential local filtering by SearchQuery if the API doesn't support it directly.
        let dataToSet = res.data || [];
        const query = this.searchQuery().trim().toLowerCase();
        if (query) {
            dataToSet = dataToSet.filter(s => s.name.toLowerCase().includes(query) || s.tags.some(t => t.toLowerCase().includes(query)));
        }

        this.studios.set(dataToSet);
        this.totalItems.set(res.pageCount || 0);
      },
      error: (err) => console.error('Failed to fetch studios', err)
    });
  }

  // --- UI Interactions ---
  toggleSort(event: Event) {
    event.stopPropagation();
    this.isSortOpen.set(!this.isSortOpen());
    this.isFilterOpen.set(false);
  }

  toggleFilter(event: Event) {
    event.stopPropagation();
    this.isFilterOpen.set(!this.isFilterOpen());
    this.isSortOpen.set(false);
  }

  applySort(value: StudioSortOption) {
    this.selectedSort.set(value);
    this.isSortOpen.set(false);
    this.currentPage.set(1);
    this.loadStudios();
  }

  getSortLabel(): string {
    return this.sortOptions.find(opt => opt.value === this.selectedSort())?.label || 'Recommended';
  }

  applyFilters() {
    this.appliedDistance.set(this.tempDistance() === -1 ? null : this.tempDistance());
    this.appliedRating.set(this.tempRating() === 0 ? null : this.tempRating());
    this.isFilterOpen.set(false);
    this.currentPage.set(1);
    this.loadStudios();
  }

  clearAllFilters() {
    this.appliedDistance.set(null);
    this.appliedRating.set(null);
    this.tempDistance.set(null);
    this.tempRating.set(null);
    this.currentPage.set(1);
    this.loadStudios();
  }

  removeFilter(type: 'distance' | 'rating') {
    if (type === 'distance') {
      this.appliedDistance.set(null);
      this.tempDistance.set(null);
    }
    if (type === 'rating') {
      this.appliedRating.set(null);
      this.tempRating.set(null);
    }
    this.currentPage.set(1);
    this.loadStudios();
  }

  toggleFavorite(id: string) {
    const current = new Set(this.favorites());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.favorites.set(current);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadStudios();
      window.scrollTo(0, 0);
    }
  }

  onDistanceChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.tempDistance.set(val === 'Any' ? -1 : parseInt(val, 10));
  }
}