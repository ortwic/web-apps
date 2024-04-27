export interface CalendarEvent {
    summary: string;
    description: string;
    location: string;
    created: string;
    creator: Contact;
    organizer: Contact;
    start: Date;
    end: Date;
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