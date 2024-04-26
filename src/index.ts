import 'dotenv/config';
import moment from 'moment';
import { inspect } from 'util';
import { scrapePages } from './service/scraper';
import { OpenPianoAppointmentService } from './pages/openpiano-appointment.config';
import { createCalendar } from './service/calendar.service';
import { createFirestore } from './service/firebase.service';
import { CalendarEvent } from './service/event.model';
import { logger } from './service/logger';

const openPianoConfig = new OpenPianoAppointmentService();

async function updateFirestore(events: CalendarEvent[]) {
    try {
        const store = createFirestore();

        logger.info('Update firestore documents');
        return Promise.all(events.map(e => {
            const week = `${moment(e.start.dateTime).isoWeek()}`;
            const location = e.location.replace(/\W+/g, '');
            const id = `${week.padStart(2, '0')}-openpiano-${location}`;
            return store.setDocument({ ...e, id });
        }));
    } catch (error) {
        logger.error(error);        
    }
}

async function updateCalendar(events: CalendarEvent[]) {
    try {
        const calendar = await createCalendar();
        logger.debug(inspect(events.filter(e => !calendar.eventExists(e))));

        logger.info(`Removing ${calendar.events?.length ?? 0} existing events.`);
        await calendar.deleteEvents(ev => ev.creator?.email === process.env.CLIENT_EMAIL);

        const result = await calendar.insertEvents(events);
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
            await updateCalendar(events);
            await updateFirestore(events);
        }
    } catch (error) {
        logger.error(error);
    }
})();
