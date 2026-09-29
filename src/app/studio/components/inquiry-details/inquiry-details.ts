import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { InquiryData } from '../../models/inquiry-details';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader';
import { StudioService } from '../../services/studio.service';
import { MemberDetails } from '../../models/member-details';
import { EventStatus } from '../../../consumer/enums/event.status.enum';

@Component({
  selector: 'app-inquiry-details',
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
  templateUrl: './inquiry-details.html',
  styleUrl: './inquiry-details.css',
})
export class InquiryDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studioService = inject(StudioService);
  private snackBar = inject(MatSnackBar);

  // Component State Signals
  inquiryId = signal<string | null>(null);
  inquiry = signal<InquiryData | null>(null);
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Team Assignment Modal State
  isAssignModalOpen = signal<boolean>(false);
  teamSearchQuery = signal<string>('');
  assignmentNotes = signal<string>('');
  selectedTeamMemberIds = signal<string[]>([]);
  
  isAcceptModalOpen = signal<boolean>(false);
  isDeclineModalOpen = signal<boolean>(false);
  declineReason = signal<string>('');

  availableMembers = signal<MemberDetails[]>([]);

  eventStatus = EventStatus;

  private colorProfiles = [
    { avatar: 'bg-orange-50 text-orange-600', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
    { avatar: 'bg-blue-50 text-blue-600', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
    { avatar: 'bg-green-50 text-green-600', badge: 'bg-green-50 text-green-600 border-green-100' },
    { avatar: 'bg-purple-50 text-purple-600', badge: 'bg-purple-50 text-purple-600 border-purple-100' },
  ];

  // Computed Helpers
  filteredMembers = computed(() => {
    const q = this.teamSearchQuery().toLowerCase().trim();
    if (!q) return this.availableMembers();
    
    return this.availableMembers().filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.employeeRole.toLowerCase().includes(q)
    );
  });

  statusBadge = computed(() => {
    const status = this.inquiry()?.status?.toLowerCase();
    switch (status) {
      case 'accepted':
        return { label: 'PAYMENT PENDING', class: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'confirmed':
      case 'paid':
        return { label: 'PAYMENT CONFIRMED', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'rejected':
        return { label: 'DECLINED', class: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { label: 'NEW INQUIRY', class: 'bg-orange-100 text-[#CF6B4E] border-orange-200' };
    }
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('inquiryId');
    if (id) {
      this.inquiryId.set(id);
      this.fetchInquiryDetails(id);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Inquiry ID is missing.');
    }
  }

  fetchInquiryDetails(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studioService.getInquiryDetails(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: InquiryData) => {
          this.inquiry.set(res);
        },
        error: (err) => {
          console.error('Error fetching inquiry details:', err);
          this.errorMessage.set('Failed to load inquiry details. Please try again.');
        }
      });
  }

  acceptInquiry(): void {
    this.processInquiryResponse(true);
  }

  declineInquiry(): void {
    this.processInquiryResponse(false);
  }

  // --- Team Member UI Helpers ---
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getColorProfile(name: string) {
    if (!name) return this.colorProfiles[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.colorProfiles.length;
    return this.colorProfiles[index];
  }

  // --- Team Member Assignment Modal ---
  openAssignModal(): void {
    this.isAssignModalOpen.set(true);
    this.fetchMembers();
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
    this.teamSearchQuery.set('');
    this.assignmentNotes.set('');
    if (this.inquiryId() != null)
      this.fetchInquiryDetails(this.inquiryId() as string);
  }

  toggleTeamMember(memberId: string): void {
    const current = this.selectedTeamMemberIds();
    if (current.includes(memberId)) {
      this.selectedTeamMemberIds.set(current.filter(id => id !== memberId));
    } else {
      this.selectedTeamMemberIds.set([...current, memberId]);
    }
  }

  isMemberSelected(memberId: string): boolean {
    return this.selectedTeamMemberIds().includes(memberId);
  }

  confirmTeamAssignments(): void {
    // This is currently a placeholder logic as in the provided code
    // It can be adapted to hit the real endpoint using selectedTeamMemberIds() and assignmentNotes()
    
    const id = this.inquiryId();
    if (!id || this.selectedTeamMemberIds().length === 0) return;
    this.isActionLoading.set(true);
    this.studioService.assignTeamMembers(id, this.selectedTeamMemberIds())
      .pipe(finalize(() => {
        this.isActionLoading.set(false);
        this.closeAssignModal();
      }))
      .subscribe({
        next: () => {
          this.snackBar.open('Team members assigned successfully!', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to assign team members.', 'Close', { duration: 3000 });
        }
      });

    this.snackBar.open('Assignments confirmed (placeholder)', 'Close', { duration: 3000 });
    this.closeAssignModal();
  }

  private processInquiryResponse(isAccepted: boolean, rejectedMessage?: string | null): void {
    const id = this.inquiryId();
    if (!id) return;
    
    this.isActionLoading.set(true);

    this.studioService.respondToInquiry(id, isAccepted, rejectedMessage)
      .pipe(finalize(() => {
        this.isActionLoading.set(false);
        if (isAccepted) this.closeAcceptModal();
        else this.closeDeclineModal();
      }))
      .subscribe({
        next: () => {
          this.snackBar.open(isAccepted ? 'Inquiry accepted!' : 'Inquiry declined.', 'Close', { duration: 3000 });
          this.fetchInquiryDetails(id);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to update inquiry.', 'Close', { duration: 3000 });
        }
      });
  }

  downloadReceipt(): void {
    this.snackBar.open('Downloading payment receipt...', 'Close', { duration: 2500 });
  }

  copyContact(text: string, type: string): void {
    navigator.clipboard.writeText(text);
    this.snackBar.open(`${type} copied to clipboard!`, 'Close', { duration: 2000 });
  }

  goBack(): void {
    this.router.navigate(['/studio/inquiries']);
  }

  openAcceptModal(): void {
    this.isAcceptModalOpen.set(true);
  }
  
  closeAcceptModal(): void {
    this.isAcceptModalOpen.set(false);
  }

  openDeclineModal(): void {
    this.declineReason.set(''); // Reset reason
    this.isDeclineModalOpen.set(true);
  }
  
  closeDeclineModal(): void {
    this.isDeclineModalOpen.set(false);
  }

  // --- Action Executions ---
  confirmAccept(): void {
    this.processInquiryResponse(true);
  }

  confirmDecline(): void {
    const reason = this.declineReason().trim();
    this.processInquiryResponse(false, reason.length > 0 ? reason : null);
  }

  fetchMembers(){
    this.studioService.getTeamMembers().subscribe({
      next: (members) => {
        this.availableMembers.set(members);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to fetch team members.', 'Close', { duration: 3000 });
      }
    });
  }


}