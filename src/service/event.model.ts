export interface CalendarEvent {
    created: string;
    summary: string;
    description: string;
    location: string;
    organizer: {
        displayName: string;
        email: string;
    }
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
}