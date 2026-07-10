import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  @Input() aboutDetails!: {
    about : string,
    contactInformation: {
      number: string,
      website: string,
      email: string
    },
    locationDetails: {
      city: string,
      distance: number 
    },
    teamMembers: number
  }
}
