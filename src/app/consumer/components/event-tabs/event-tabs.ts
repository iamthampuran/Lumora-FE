import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-event-tabs',
  imports: [],
  templateUrl: './event-tabs.html',
  styleUrl: './event-tabs.css',
})
export class EventTabs {
    readonly activeTab = signal<'draft' | 'active' | 'completed'>('draft');

    setActiveTab(tab: 'draft' | 'active' | 'completed'): void {
    this.activeTab.set(tab);
  }

  @Input() events: { id: number; title: string; date: string; location: string; duration: string; status: string; updated: string }[] = [];

}
