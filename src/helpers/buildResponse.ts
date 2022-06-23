/* eslint-disable @typescript-eslint/ban-types */
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { IServiceResponse } from '../interfaces';

class ApplicationError extends Error {
    statusCode: number;

    errors: Array<string>;

    constructor(message: string, statusCode: number, errors?: Array<string>) {
        super(message);

        this.statusCode = statusCode;
        this.errors = errors;
    }
}

export default (
    response: Response,
    serviceResponse: IServiceResponse | ApplicationError,
    errors?: Array<string>,
): Object | void => {
    if (
        serviceResponse instanceof ApplicationError ||
        serviceResponse instanceof Error ||
        (serviceResponse.status && serviceResponse.msg)
    ) {
        console.error(serviceResponse);
        return response
            .status(
                serviceResponse.statusCode ||
                    (serviceResponse as IServiceResponse).status ||
                    StatusCodes.INTERNAL_SERVER_ERROR,
            )
            .json(
                errors
                    ? {
                          message:
                              (serviceResponse as IServiceResponse).msg ||
                              (serviceResponse as ApplicationError).message,
                          errors,
                      }
                    : {
                          message:
                              (serviceResponse as ApplicationError).message ||
                              (serviceResponse as IServiceResponse).msg,
                      },
            );
    }

    const empty = Object.keys(serviceResponse).length === 0;
    const responseHasBody =
        serviceResponse.body && Object.keys(serviceResponse.body).length !== 0;

    if (
        empty ||
        !responseHasBody ||
        serviceResponse.statusCode === StatusCodes.NO_CONTENT
    )
        return response.set({ 'Content-Length': 0 }).status(StatusCodes.NO_CONTENT).end();

    return response
        .set(serviceResponse.headers)
        .status(serviceResponse.statusCode)
        .json(serviceResponse.body);
};
