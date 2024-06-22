import type { EnumValues, EnumValueConfig } from "../types/properties";

export function enumToObjectEntries(enumValues: EnumValues): EnumValueConfig[] {
    if (Array.isArray(enumValues)) {
        return enumValues;
    } else {
        return Object.entries(enumValues).map(([id, value]) => {
            if (typeof value === "string") {
                return {
                    id,
                    label: value
                }
            } else {
                return {
                    ...value,
                    id
                }
            }
        });
    }
}

export function getLabelOrConfigFrom(enumValues: EnumValueConfig[], key?: string | number): EnumValueConfig | undefined {
    if (!key) return undefined;
    return enumValues.find((entry) => String(entry.id) === String(key));
}

export function isEnumValueDisabled(labelOrConfig?: string | EnumValueConfig) {
    return typeof labelOrConfig === "object" && (labelOrConfig as EnumValueConfig).disabled;
}

export function buildEnumLabel(
    labelOrConfig?: string | EnumValueConfig
): string | undefined {
    if (labelOrConfig === undefined)
        return undefined;
    if (typeof labelOrConfig === "object") {
        return labelOrConfig.label;
    } else {
        return labelOrConfig;
    }
}
