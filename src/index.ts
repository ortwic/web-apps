import { inspect } from 'util';
import { scrapePages } from './service/scraper';
import { OpenPianoAppointmentService } from './pages/openpiano-appointment.config';
import { createCalendar } from './service/calendar.service';
import { logger } from './service/logger';

const openPianoConfig = new OpenPianoAppointmentService();

(async () => {
    try {
        const calendar = await createCalendar();
        // await calendar.deleteEvents();

        const events = await scrapePages(openPianoConfig)
            .then(e => e.filter(e => e.summary));

        logger.info(`Scraped ${events.length} events from ${openPianoConfig.url}`);
        logger.debug(inspect(events));
      
        const result = await calendar.insertEvents(events);
        logger.info(`Added ${result.length} events to calendar.`);
    } catch (error) {
        logger.error(error);
    }
})();
