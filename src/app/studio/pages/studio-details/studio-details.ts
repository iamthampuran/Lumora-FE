import { Component, inject, OnInit } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { PricingDetails, StudioIdentityResponse, StudioProfileModel, TagDetails } from '../../models/studio-profile-model';
import { StudioService } from '../../servies/studio.service';
import { ActivatedRoute } from '@angular/router';
import { StatsBar } from "../../components/stats-bar/stats-bar";

@Component({
  selector: 'app-studio-details',
  imports: [Hero, StatsBar],
  templateUrl: './studio-details.html',
  styleUrl: './studio-details.css',
})
export class StudioDetails implements OnInit {

  actualData!: StudioProfileModel;
  public sampleHeroData!: {
      identityResponse: StudioIdentityResponse;
      priceDetails: PricingDetails;
      tags: TagDetails[];
      location: string;
    }

  public sampleStatsBarData!: {
    ratingDetails: {
      averageRating: number,
      totalReviews: number
    },
    completedEvents: number,
    memberCount: number,
    location: string
  }

  protected studioService = inject(StudioService)
  private route = inject(ActivatedRoute);

  constructor() {
    this.assignHeroData();
    this.assignStatsBarData()
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('studioId');
    // if (id) {
    //   this.getStudioDetails(id);
    // }
  }

  getStudioDetails(studioId: string) {
    this.studioService.getStudioDetails(studioId).subscribe({
      next: (data) => {
        this.actualData = data;
        console.log('Studio Details:', this.actualData);
      },
      error: (error) => {
        console.error('Error fetching studio details:', error);
      }
    });
  }

  assignHeroData(){
    this.sampleHeroData = {
      identityResponse: {
        id: "abcd",
        studioName: "Sarah Mitchell Studio",
        logoUrl: "https://images.unsplash.com/photo-1560364897-91578ff41817?auto=format&fit=crop&w=200&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      },
      priceDetails: {
        minPrice: 50000,
        maxPrice: 150000
      },
      tags: [
        {
          id: "1",
          name: "Luxury Weddings"
        }
      ],
      location: "New York, USA"
    }
  }
  
  assignStatsBarData(){
    this.sampleStatsBarData = {
      ratingDetails: {
        averageRating: 2.55,
        totalReviews: 120
      },
      completedEvents: 50,
      memberCount: 10,
      location: "New York, USA" 
    }
  }

}
