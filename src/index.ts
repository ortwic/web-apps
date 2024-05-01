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

const openPianoConfig = new OpenPianoAppointmentService();

async function updateFirestore(events: CalendarEvent[]) {
    const clean = (s: string) => s?.replace(/\W+/g, '').toLowerCase();
    const createId = (e: CalendarEvent) => {
        const week = `${moment(e.start.dateTime).isoWeek()}`;
        const creator = e.creator?.email === email ? 'songrepo' 
            : clean(`${e.creator?.email}`.split('@')[0]) ?? 'unknown';
        return `${week.padStart(2, '0')}-${creator}-${clean(e.location)}`;
    };
    try {
        const storeService = createFirestoreService();
        const placeService = createPlaceService();

        logger.info('Update firestore documents');
        return Promise.all(
            events.map(async e => {
                const id = createId(e);
                const place = await placeService.findPlace(e.location);
                const created = (e?.createdUTC ? new Date(e.createdUTC).toISOString() : e.created);
                return storeService.setDocument(id, { ...e, id, created, place });
            })
        );
    } catch (error) {
        logger.error(`updateFirestore: ${inspect(error)}`);
    }
}

async function updateCalendar(events: CalendarEvent[]) {
    try {
        const service = await createCalendarService();
        // logger.debug(inspect(events.filter(e => !service.eventExists(e))));

        logger.info(`Removing ${service.events?.length ?? 0} existing events.`);
        await service.deleteEvents(ev => ev.creator?.email === process.env.CLIENT_EMAIL);

        const result = await service.insertEvents(events);
        logger.info(`Added ${result.length} events to calendar.`);

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
