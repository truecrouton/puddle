import { Request, ResponseToolkit, ResponseObject, ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import { connect } from "mqtt";
import { storageInit, Pair, Topic } from "../storage";

export const routesUi: ServerRoute[] = [
    {
        method: "GET",
        path: '/{param*}',
        handler: {
            directory: {
                path: './webapp/dist'
            }
        },
        options: {
            auth: {
                mode: 'try'
            }
        }
    }
];