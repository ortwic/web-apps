import { inspect } from 'util';
import { scrapePages } from './service/scraper';
import { OpenPianoAppointmentService } from './pages/openpiano-appointment.config';
import { createCalendar } from './service/calendar.service';
import { logger } from './service/logger';

// const event = {
//     'summary': 'Google I/O 2023',
//     'location': '800 Howard St., San Francisco, CA 94103',
//     'description': 'A chance to hear more about Google\'s developer products.',
//     'start': {
//         'dateTime': '2023-08-28T09:00:00-07:00',
//         'timeZone': 'America/Los_Angeles'
//     },
//     'end': {
//         'dateTime': '2023-08-28T17:00:00-07:00',
//         'timeZone': 'America/Los_Angeles'
//     }
// };

const openPianoConfig = new OpenPianoAppointmentService();

(async () => {
    try {
        const calendar = await createCalendar();
        // await calendar.insertEvents([event]);

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
