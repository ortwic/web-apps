import 'dotenv/config';
import moment from 'moment';
import { inspect } from 'util';
import { scrapePages } from './service/scraper';
import { OpenPianoAppointmentService } from './pages/openpiano-appointment.config';
import { createCalendarService, email } from './service/calendar.service';
import { createFirestoreService } from './service/firebase.service';
import { CalendarEvent } from './service/event.model';
import { createPlaceService } from './service/place.service';
import { logger } from './service/logger';

const openPianoConfig = new OpenPianoAppointmentService(email!);

function exclude<T>(source: T[], target: T[], key: keyof T) {
    return source.filter(a => !target.some(b => a[key] === b[key]));
}

async function updateFirestore(events: CalendarEvent[]) {
    const clean = (s: string) => s?.replace(/\W+/g, '').toLowerCase();
    const createId = (e: CalendarEvent) => {
        const week = `${moment(e.start.dateTime).isoWeek()}`;
        const creator = e.creator?.email === email ? 'songrepo' 
            : clean(`${e.creator?.email}`.split('@')[0]) ?? 'unknown';
        return `${week.padStart(2, '0')}-${creator}-${clean(e.location)}`;
    };
    try {
        const storeService = createFirestoreService(email!);
        const placeService = createPlaceService();

        logger.info('Remove obsolete documents');
        const eventsWithId = events.map(e => ({ ...e, id: createId(e) }));
        const obsolete = exclude(await storeService.getDocuments(), eventsWithId, 'id');
        await Promise.all(obsolete.map(e => storeService.removeDocument(e.id)));

        logger.info('Update firestore documents');
        return Promise.all(
            eventsWithId.map(async e => {
                const place = await placeService.findPlace(e.location);
                const created = (e?.createdUTC ? new Date(e.createdUTC).toISOString() : e.created);
                return storeService.setDocument(e.id, { ...e, created, place });
            })
        );
    } catch (error) {
        logger.error(`updateFirestore: ${inspect(error)}`);
    }
}

async function updateCalendar(events: CalendarEvent[]): Promise<CalendarEvent[]> {
    try {
        const service = await createCalendarService();
        // logger.debug(inspect(events.filter(e => !service.eventExists(e))));

        logger.info(`Removing ${service.events?.length ?? 0} existing events.`);
        await service.deleteEvents(ev => ev.creator?.email === email);

        // const result = await service.insertEvents(events);
        // logger.info(`Added ${result.length} events to calendar.`);

        return service.foreignEvents() as CalendarEvent[];
    } catch (error) {
        logger.error(`updateCalendar: ${inspect(error)}`);
    }
    return [];
}

(async () => {
    try {
        const scrapedEvents = await scrapePages(openPianoConfig)
            .then(e => e.filter(e => e.summary));
        logger.info(`Scraped ${scrapedEvents.length} events from ${openPianoConfig.url}`);

        if (scrapedEvents.length) {
            const events = await updateCalendar(scrapedEvents);
            await updateFirestore([...scrapedEvents, ...events]);
        }
    } catch (error) {
        logger.error(`root: ${inspect(error)}`);
    }
})();
