import { readFile, writeFile } from "fs/promises";
import path from "path";
import { buildEntityProperties } from "../src/lib/schema/inference.helper";

function generateContentPropertiesFromSchema(schema: any) {
    const defs = schema.definitions;
    if (!defs) throw new Error("Schema has no definitions");

    const properties: Record<string, any> = {};

    const propertyRefs = defs.Property?.anyOf as Array<any>;
    if (!Array.isArray(propertyRefs)) {
        throw new Error("Property.anyOf missing");
    }

    for (const entry of propertyRefs) {
        const ref = entry["$ref"];
        if (!ref) continue;
        const defName = ref.replace("#/definitions/", "");
        const propDef = defs[defName];
        if (!propDef) continue;

        const dt = propDef.properties?.dataType?.const;
        if (!dt) continue;

        const base: any = {
            dataType: dt,
            name: capitalize(dt)
        };

        if (dt === "map") {
            base.properties = cloneProperties(propDef.properties?.properties ?? {});
        }

        if (dt === "set") {
            base.oneOf = cloneOneOf(propDef.properties?.oneOf);
        }

        if (dt === "array") {
            base.of = cloneProperty(propDef.properties?.of);
        }

        if (defName === "FileProperty") {
            base.preview = propDef.properties?.preview?.enum?.[0] ?? "file";
            base.storage = propDef.properties?.storage ?? {};
        }

        if (defName === "UrlProperty") {
            base.url = true;
        }

        properties[dt] = base;
    }

    return properties;
}

// Helpers
function cloneProperties(props: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const key of Object.keys(props)) {
        out[key] = cloneProperty(props[key]);
    }
    return out;
}
function cloneOneOf(oneOf: any) {
    if (!oneOf) return {};
    return {
        properties: cloneProperties(oneOf.properties ?? {}),
        propertiesOrder: oneOf.propertiesOrder ?? [],
        typeField: oneOf.typeField,
        valueField: oneOf.valueField
    };
}
function cloneProperty(p: any) {
    if (!p) return {};
    return JSON.parse(JSON.stringify(p));
}
function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// -------------------------
// EXECUTION PART
// -------------------------

(async () => {
    const inputFile = path.resolve("src/lib/schema/generated/property-record.schema.json");
    const tempFile = path.resolve("src/lib/schema/generated/content-property-map.json");
    const outputFile = path.resolve("src/lib/schema/generated/property-content-as-content-map.json");

    console.log("Reading schema:", inputFile);
    const jsonSchema = JSON.parse(await readFile(inputFile, "utf-8"));

    console.log("Generating content properties");
    const contentProperties = generateContentPropertiesFromSchema(jsonSchema);

    await writeFile(tempFile, JSON.stringify(contentProperties, null, 2));

    console.log("Infer data schema from properties");
    const propertySet = await buildEntityProperties([contentProperties]);

    const properties = {
        id: {
            dataType: "string",
            name: "Id",
            validation: {
                required: true
            },
            editable: false
        },
        name: {
            dataType: "string",
            name: "Name",
            validation: {
                required: true
            },
            editable: false
        },
        path: {
            dataType: "string",
            name: "Path",
            validation: {
                required: true
            },
            editable: false
        },
        content: {
            dataType: "set",
            name: 'Content',
            oneOf: {
                properties: propertySet
            }
        }
    };

    await writeFile(outputFile, JSON.stringify(properties, null, 2));

    console.log(`🌟 Done! Schema written to: ${outputFile}`);
})();

