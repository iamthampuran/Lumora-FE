export interface EventData{
    inquiryDetails: InquiryDetail[];
    eventInformationDetails: EventInformationDetails;
}

export interface InquiryDetail{
    id: string;
    studioName: string;
    profileUrl: string | null;
    inquiryStatus: string;
    amount: number;
    lastUpdated: Date;
}

export interface EventInformationDetails{
    category: string;
    duration: number;
    budget: number;
    tags: string[];
    additionalInformation: string | null;
    title: string;
    eventDate: Date;
    location: {
        latitude: number;
        longitude: number;
        locationName: string
    }
}

export interface EventEditDetails {
  id: string;
  consumerId: string;
  title: string;
  eventDate: string;
  location: {
    latitude: number;
    longitude: number;
    locationName: string;
  };
  eventTypeId: string;
  budget: number;
  duration: number;
  specialRequirements: string | null;
  tags: Record<string, string>; 
}