import { ServerRoute } from "@hapi/hapi";
import { routesApi } from "./api";
import { routesUi } from "./ui";

export const routes: ServerRoute[] = [
    ...routesApi,
    ...routesUi
];