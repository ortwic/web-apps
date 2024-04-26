import 'dotenv/config';
import moment from 'moment';
import { inspect } from 'util';
import { scrapePages } from './service/scraper';
import { OpenPianoAppointmentService } from './pages/openpiano-appointment.config';
import { createCalendarService } from './service/calendar.service';
import { createFirestoreService } from './service/firebase.service';
import { CalendarEvent } from './service/event.model';
import { createPlaceService } from './service/place.service';
import { logger } from './service/logger';

const openPianoConfig = new OpenPianoAppointmentService();
const createdAt = new Date().toUTCString();

async function updateFirestore(events: CalendarEvent[]) {
    const createId = (e: CalendarEvent) => {
        const week = `${moment(e.start.dateTime).isoWeek()}`;
        const location = e.location.replace(/\W+/g, '');
        return `${week.padStart(2, '0')}-openpiano-${location}`;
    };
    try {
        const storeService = createFirestoreService();
        const placeService = createPlaceService();

        logger.info('Update firestore documents');
        return Promise.all(events.map(async e => {
            const place = await placeService.findPlace(e.location);
            return storeService.setDocument(createId(e), { ...e, place, createdAt });
        }));
    } catch (error) {
        logger.error(error);        
    }
}

async function updateCalendar(events: CalendarEvent[]) {
    try {
        const service = await createCalendarService();
        logger.debug(inspect(events.filter(e => !service.eventExists(e))));

        logger.info(`Removing ${service.events?.length ?? 0} existing events.`);
        await service.deleteEvents(ev => ev.creator?.email === process.env.CLIENT_EMAIL);

        const result = await service.insertEvents(events);
        logger.info(`Added ${result.length} events to calendar.`);
    } catch (error) {
        
    }
}

(async () => {
    try {        
        const events = await scrapePages(openPianoConfig)
            .then(e => e.filter(e => e.summary));
        logger.info(`Scraped ${events.length} events from ${openPianoConfig.url}`);
        
        if (events.length) {
            // await updateCalendar(events);
            await updateFirestore(events);
        }
    } catch (error) {
        logger.error(error);
    }
})();
