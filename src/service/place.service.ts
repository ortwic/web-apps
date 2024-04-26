import { AddressGeometry, Client, PlaceData } from "@googlemaps/google-maps-services-js";
import { logger } from "./logger";

export function createPlaceService() {
    const client = new Client({});

    async function findPlace(address: string): Promise<Partial<PlaceData>> {
        if (address?.length) {
            try {
                const response = await client.textSearch({
                    params: {
                        query: address,
                        key: process.env.GOOGLE_API_KEY!,
                    },
                });

                if (response.data.results && response.data.results.length > 0) {
                    const place = response.data.results[0];
                    return {
                        place_id: place.place_id ?? '',
                        name: place.name ?? '',
                        formatted_address: place.formatted_address ?? '',
                        geometry: place.geometry ?? {} as AddressGeometry,
                        icon: place.icon ?? '',
                        icon_background_color: place.icon_background_color ?? '',
                        url: place.url ?? '',
                        website: place.website ?? ''
                    };
                } else {
                    return {
                        name: `No results found for ${address}`
                    }
                }
            } catch (error: any) {
                const message = error?.response?.data?.error_message ?? error?.message;
                logger.error(message ?? error);
            }
        }
        return {} as PlaceData;
    }

    return {
        findPlace,
    };
}
