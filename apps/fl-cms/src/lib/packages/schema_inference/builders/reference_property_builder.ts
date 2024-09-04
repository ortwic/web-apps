/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Property } from "../../firecms_core/types/properties";
import { findCommonInitialStringInPath } from "../strings";
import type { InferencePropertyBuilderProps } from "../types";

export function buildReferenceProperty({
                                        totalDocsCount,
                                        valuesResult
                                    }: InferencePropertyBuilderProps): Property {

    const property: Property = {
        dataType: "reference",
        path: findCommonInitialStringInPath(valuesResult) ?? "!!!FIX_ME!!!",
        editable: true
    };

    return property;
}
