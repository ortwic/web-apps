export interface CalendarEvent {
    summary: string;
    description: string;
    location: string;
    createdAt?: string;
    creator: Contact;
    organizer: Contact;
    start: Date;
    end: Date;
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