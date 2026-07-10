import { Component, Input } from '@angular/core';
import {
  PricingDetails,
  StudioIdentityResponse,
  TagDetails,
} from '../../models/studio-profile-model';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  @Input() heroDetails!: {
    identityResponse: StudioIdentityResponse;
    priceDetails: PricingDetails;
    tags: TagDetails[];
    location: string;
  };

  
}
