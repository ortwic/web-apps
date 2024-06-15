import type { PageServerLoad, RouteParams } from './$types';

export const load = (({ params }) => {
    const id = (params as RouteParams).id;

    return {
        id
    };
}) satisfies PageServerLoad;
