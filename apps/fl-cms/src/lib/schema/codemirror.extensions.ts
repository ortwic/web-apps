import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import { jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import { hoverTooltip } from "@codemirror/view";
import { handleRefresh, jsonCompletion, jsonSchemaHover, jsonSchemaLinter, stateExtensions } from "codemirror-json-schema";
import type { JSONSchema7 } from "json-schema";

export function autocomplete<T>(schema: T) {
    return [
        autocompletion(),
        linter(jsonParseLinter(), { delay: 300, needsRefresh: handleRefresh }),
        linter(jsonSchemaLinter(), { delay: 300, needsRefresh: handleRefresh }),
        hoverTooltip(jsonSchemaHover()),
        jsonLanguage.data.of({ 
            autocomplete(context: CompletionContext) {
                const completion = jsonCompletion();
                return completion(context);
            } 
        }),
        stateExtensions(schema as JSONSchema7),
    ];
} 
