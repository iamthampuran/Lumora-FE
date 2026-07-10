import { Component, inject, OnInit } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import {
  PortfolioDetails,
  PricingDetails,
  StudioIdentityResponse,
  StudioProfileModel,
  TagDetails,
} from '../../models/studio-profile-model';
import { StudioService } from '../../servies/studio.service';
import { ActivatedRoute } from '@angular/router';
import { StatsBar } from '../../components/stats-bar/stats-bar';
import { About } from '../../components/about/about';
import { PortfolioGallery } from '../../components/portfolio-gallery/portfolio-gallery';

@Component({
  selector: 'app-studio-details',
  imports: [Hero, StatsBar, About, PortfolioGallery],
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
  };

  public sampleStatsBarData!: {
    ratingDetails: {
      averageRating: number;
      totalReviews: number;
    };
    completedEvents: number;
    memberCount: number;
    location: string;
  };

  public sampleAboutData!: {
    about: string;
    contactInformation: {
      number: string;
      website: string;
      email: string;
    };
    locationDetails: {
      city: string;
      distance: number;
    };
    teamMembers: number;
  };

  public samplePortfolioData!: PortfolioDetails[];

  protected studioService = inject(StudioService);
  private route = inject(ActivatedRoute);

  constructor() {
    this.assignHeroData();
    this.assignStatsBarData();
    this.assignAboutData();
    this.assignPortfolioData();
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
      },
    });
  }

  assignHeroData() {
    this.sampleHeroData = {
      identityResponse: {
        id: 'abcd',
        studioName: 'Sarah Mitchell Studio',
        logoUrl:
          'https://images.unsplash.com/photo-1560364897-91578ff41817?auto=format&fit=crop&w=200&q=80',
        coverImageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      },
      priceDetails: {
        minPrice: 50000,
        maxPrice: 150000,
      },
      tags: [
        {
          id: '1',
          name: 'Luxury Weddings',
        },
      ],
      location: 'New York, USA',
    };
  }

  assignStatsBarData() {
    this.sampleStatsBarData = {
      ratingDetails: {
        averageRating: 2.55,
        totalReviews: 120,
      },
      completedEvents: 50,
      memberCount: 10,
      location: 'New York, USA',
    };
  }

  assignAboutData() {
    this.sampleAboutData = {
      about:
        'Sarah Mitchell Studio is a premier wedding planning studio known for its luxurious and bespoke wedding experiences. With a team of experienced professionals, we specialize in creating unforgettable moments for our clients.',
      contactInformation: {
        number: '+1 123-456-7890',
        website: 'www.sarahmitchellstudio.com',
        email: 'smstudio@studio.com',
      },
      locationDetails: {
        city: 'New York',
        distance: 100,
      },
      teamMembers: 10,
    };
  }

  assignPortfolioData() {
    // This function can be used to assign sample data for the PortfolioGallery component in the future.
    this.samplePortfolioData = [
      {
        id: '1',
        title: 'Luxury Wedding',
        imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400',
        displayOrder: 1,
      },
      {
        id: '2',
        title: 'Beach Wedding',
        imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400',
        displayOrder: 2,
      },
      {
        id: '3',
        title: 'Garden Wedding',
        imageUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=400',
        displayOrder: 3,
      }
    ];
  }
}
