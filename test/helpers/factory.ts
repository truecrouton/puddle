import { expect } from "@hapi/code";
import { Server } from '@hapi/hapi';
import { randAccessory, randVerb, randWord } from '@ngneat/falso';

let server: Server;

export function factoryInit(withServer: Server) {
    server = withServer;
}

export async function automationCreate(params: {}): Promise<number> {
    const automationReq = {
        automation_id: 0,
        name: `${randVerb()} ${randAccessory()}`,
        ...params
    };
    const automationRes = await server.inject({
        method: 'post',
        url: `/api/automation/setup`,
        payload: automationReq,
        auth: {
            strategy: 'session',
            credentials: {}
        }
    });
    expect(automationRes.statusCode).to.equal(200);

    const { result: automation }: { result: any; } = automationRes;
    expect(automation).to.be.object();

    const automationId = Number(automation.automation_id);
    expect(automationId).to.be.greaterThan(0);

    return automationId;
}

export async function deviceCreate(params: {}): Promise<number> {
    const device = {
        device_id: 0,
        kind: 'toggleable',
        name: randAccessory(),
        state_key: randWord().toLowerCase(),
        set_key: randWord().toLowerCase(),
        set_suffix: randVerb().toLowerCase().replace(' ', '_'),
        ...params
    };

    const res = await server.inject({
        method: 'post',
        url: '/api/device/setup',
        payload: device,
        auth: {
            strategy: 'session',
            credentials: {}
        }
    });
    expect(res.statusCode).to.equal(200);

    const { result }: { result: any; } = res;
    expect(result).to.be.object();
    expect(Number(result.device_id)).to.be.greaterThan(0);

    return result.device_id;
}