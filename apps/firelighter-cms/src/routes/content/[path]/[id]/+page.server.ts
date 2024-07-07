import type { PageServerLoad, RouteParams } from './$types';

export const load = (({ params }) => {
    return {
        ...(params as RouteParams)
    };
}) satisfies PageServerLoad;
