declare module "better-ajv-errors" {
  import type { ErrorObject, Schema } from "ajv";

  export interface BetterAjvErrorPosition {
    line: number;
    column: number;
    offset: number;
  }

  export interface BetterAjvError {
    start: BetterAjvErrorPosition;
    end: BetterAjvErrorPosition;
    error: string;        // bereits formatierte Fehlermeldung
    suggestion?: string;  // optional
  }

  export interface BetterAjvErrorsOptions {
    format?: "cli" | "js";
    indent?: number;
    json?: string; // Die Library erlaubt JSON-String-Input
  }

  /**
   * DefaultValidationError class (exported by the package)
   * Represents one AJV error converted into a decorated object.
   */
  export class DefaultValidationError {
    constructor(
      error: ErrorObject,
      options: { data: any; schema: any; json?: string }
    );

    start: BetterAjvErrorPosition;
    end: BetterAjvErrorPosition;
    suggestion?: string;
    _error: ErrorObject;

    getError(): string;
    getSuggestion(): string | undefined;
  }

  export default function betterAjvErrors(
    schema: Schema,
    data: unknown,
    errors: ErrorObject[] | null | undefined,
    options?: BetterAjvErrorsOptions
  ): BetterAjvError[] | string;
}
