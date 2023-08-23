export interface Appointment {
    startDate: string | null;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    location: string | undefined;
    text: string;
}