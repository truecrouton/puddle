import { ServerRoute } from "@hapi/hapi";
import { puddlePathRoot } from "../path-anchor";

const webappPath = `${puddlePathRoot}/../../webapp/dist`;

export const routesUi: ServerRoute[] = [
    {
        method: "GET",
        path: '/{param*}',
        handler: {
            directory: {
                path: webappPath
            }
        },
        options: {
            auth: {
                mode: 'try'
            }
        }
    }
];