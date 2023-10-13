import 'dotenv/config'
import { calendar_v3 as C3, google } from 'googleapis';
import { RunBatch } from 'gbatchrequests';
import { logger } from './logger';

const email = process.env.CLIENT_EMAIL, 
    key = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    calendarId = process.env.CALENDAR_ID,
    scopes = ['https://www.googleapis.com/auth/calendar'];

const normalizeDescription = (text: string | null | undefined) => {
    return text && text.split('\nSync: ')[0]?.replace(/\s/, '');
};

export async function createCalendar() {
    const auth = new google.auth.JWT(email, undefined, key, scopes);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const list = await calendar.events.list({ calendarId });
    const events = list.data.items ?? [];

    logger.info(`Access to calendar '${calendarId}' with ${events.length} events established.`);

    const eventExists = (event: C3.Schema$Event) => {
        return events.some(e => e.summary === event.summary 
            && e.creator?.email === email
            // && e.description === event.description
            && e.location === event.location);
    };

    async function insertEvent(resource: C3.Schema$Event): Promise<C3.Schema$Event> {
        if (!eventExists(resource)) {
            const request = { calendarId, auth, resource };        
            const response = await calendar.events.insert(request);            
            return response.data;
        }
        return {};
    }

    /**
     * https://tanaikech.github.io/2022/10/11/creating-and-deleting-multiple-events-in-google-calendar-by-batch-requests-using-calendar-api-with-node.js/
     */
    async function insertEvents(resources: C3.Schema$Event[]): Promise<C3.Schema$Event[]> {
        const items = resources.filter(res => !eventExists(res));
        if (items.length) {
            return await RunBatch({
                accessToken: auth.credentials.access_token ?? '',
                api: {
                    name: 'calendar',
                    version: 'v3'
                },
                requests: resources.map((body) => ({
                    method: 'POST',
                    endpoint: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
                    requestBody: body
                }))
            });
        }
        return [];
    }
    
    async function deleteEvents(predicate: (ev: C3.Schema$Event) => boolean | undefined): Promise<C3.Schema$Event[]> {
        const items = events.filter(predicate);
        if (items.length) {
            return await RunBatch({
                accessToken: auth.credentials.access_token ?? '',
                api: {
                    name: 'calendar',
                    version: 'v3'
                },
                requests: items.map((ev) => ({
                    method: 'DELETE',
                    endpoint: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${ev.id}`
                }))
            });
        }
        return [];
    }

    return {
        events,
        eventExists,
        insertEvent,
        insertEvents,
        deleteEvents
    };
}
