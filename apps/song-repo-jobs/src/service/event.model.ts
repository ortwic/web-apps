export interface CalendarEvent {
    summary: string;
    description: string;
    location: string;
    created?: string; // ISO 8601
    createdUTC?: number;
    creator?: Contact;
    organizer: Contact;
    start: Date;
    end: Date;
    updated?: string; // ISO 8601
    website?: string;
}

interface Contact {
    id?: string;
    displayName?: string;
    email: string;
    self?: boolean;
}

interface Date {
    date?: string;
    dateTime: string;
    timeZone?: string;
}