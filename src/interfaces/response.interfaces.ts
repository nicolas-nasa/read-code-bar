/* eslint-disable @typescript-eslint/ban-types */
export interface IServiceResponse {
    headers?: Object;

    body?: Object | Array<Object> | null;

    statusCode: number;

    status?: number;

    msg?: string | Array<string>;
}

export interface IMessage {
    message: string;

    statusCode: number;
}
