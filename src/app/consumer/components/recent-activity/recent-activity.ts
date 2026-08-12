import { Component } from '@angular/core';

@Component({
  selector: 'app-consumer-recent-activity',
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.css',
})
export class ConsumerRecentActivity {
  readonly activities = [
    { id: 1, type: 'event',   iconColor: 'text-orange-500', bgColor: 'bg-orange-50', title: 'You created a new event',    target: 'Ananya & Rohit Pre-Wedding Shoot',          time: '2d ago' },
    { id: 2, type: 'message', iconColor: 'text-blue-500',   bgColor: 'bg-blue-50',   title: 'New response from',           target: 'Pixel Stories Studio',                      time: '2d ago' },
    { id: 3, type: 'quote',   iconColor: 'text-green-500',  bgColor: 'bg-green-50',  title: 'Received new quote from',     target: 'Frames by Nikhil',                          time: '3d ago' },
    { id: 4, type: 'payment', iconColor: 'text-purple-500', bgColor: 'bg-purple-50', title: 'Payment completed',           target: 'Advance payment for Sneha & Arjun Wedding', time: '1w ago' },
    { id: 5, type: 'confirm', iconColor: 'text-green-600',  bgColor: 'bg-green-50',  title: 'Event confirmed',             target: 'TechNova Annual Event',                     time: '1w ago' },
  ];
}
