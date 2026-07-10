import { Component, Input } from '@angular/core';
import { ReviewDetails } from '../../models/studio-profile-model';
import { NgClass, DatePipe } from '@angular/common';

@Component({
  selector: 'app-reviews',
  imports: [NgClass, DatePipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class Reviews {
  @Input() reviewDetails!: ReviewDetails[];
  starArray = [1, 2, 3, 4, 5];


  // A palette of warm, earthy colors matching your design mock-up
  private avatarColors = [
    'bg-[#8F7E6F]', // Muted Brown
    'bg-[#D9A876]', // Warm Sand
    'bg-[#E3D1C1]', // Light Beige
    'bg-[#C19A8A]', // Dusty Rose
    'bg-[#5C5C5C]', // Charcoal
    'bg-[#A68A72]', // Mocha
  ];

  // 1. Safely extract the first letter
  getInitial(name?: string): string {
    if (!name || name.trim() === '') return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  // 2. Assign a consistent random color based on the name
  getAvatarColor(name?: string): string {
    if (!name) return this.avatarColors[0]; // Fallback color

    // Create a simple numeric hash from the string characters
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert the hash to a positive index within our array bounds
    const index = Math.abs(hash) % this.avatarColors.length;
    return this.avatarColors[index];
  }
}
