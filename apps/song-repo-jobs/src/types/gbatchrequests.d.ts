declare module 'gbatchrequests' {
    export interface Request {
        method: string;
        endpoint: string;
        requestBody?: any;
    }
  
    export interface API {
        name: string;
        version?: string;
    }
  
    export interface BatchRequestsObject {
        accessToken: string;
        api: API;
        requests: Request[];
        skipError?: boolean;
        returnRawData?: boolean;
    }
  
    export function GetBatchPath(obj: BatchRequestsObject): Promise<string>;
    export function RunBatch<T>(obj: BatchRequestsObject): Promise<T[]>;
}