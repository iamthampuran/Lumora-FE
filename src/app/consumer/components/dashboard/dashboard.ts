import { Component, signal } from '@angular/core';
import { ConsumerSidebar } from '../sidebar/sidebar';
import { ConsumerTopbar } from '../topbar/topbar';
import { ConsumerRecentActivity } from '../recent-activity/recent-activity';
import { EventTabs } from "../event-tabs/event-tabs";

@Component({
  selector: 'app-dashboard',
  imports: [ConsumerSidebar, ConsumerTopbar, ConsumerRecentActivity, EventTabs],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  readonly events = [
    { id: 1, title: 'Ananya & Rohit Pre-Wedding Shoot', date: '15 Dec 2025', location: 'Kochi, Kerala', duration: 'Half Day',  status: 'Draft', updated: '2 days ago' },
    { id: 2, title: "Aarav's Birthday Photoshoot",      date: '03 Jan 2026', location: 'Kakkanad, Kochi', duration: '2 Hours', status: 'Draft', updated: '5 days ago'  },
  ];

}
