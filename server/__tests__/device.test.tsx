import { GET_DEVICE, GET_DEVICE_STUBS, UPSERT_DEVICE, UPSERT_TOPIC } from './utils/queries';
import { test, expect } from './utils/fixtures';
import { createDeviceFactory, createTopicFactory } from './utils/factories';

test('create and get a device and get devices', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicRes = await executeOperation(UPSERT_TOPIC, { input: topic });
    expect(topicRes.upsertTopic).toBeTruthy();
    expect(topicRes.upsertTopic.id).toBeTypeOf('number');
    expect(topicRes.upsertTopic.id).toBeGreaterThan(0);
    expect(topicRes.upsertTopic.topic).toEqual(topic.topic);

    const device = createDeviceFactory({ topicId: topicRes.upsertTopic.id });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice).toBeTruthy();
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);
    expect(deviceRes.upsertDevice.name).toEqual(device.name);

    const getDeviceRes = await executeOperation(GET_DEVICE, { id: deviceRes.upsertDevice.id });
    expect(getDeviceRes.device).toBeTruthy();
    expect(getDeviceRes.device.id).toEqual(deviceRes.upsertDevice.id);
    expect(getDeviceRes.device.name).toEqual(device.name);
    expect(getDeviceRes.device.stateKey).toEqual(device.stateKey);
    expect(getDeviceRes.device.setKey).toEqual(device.setKey);
    expect(getDeviceRes.device.setSuffix).toEqual(device.setSuffix);
    expect(getDeviceRes.device.valueOn).toEqual(device.valueOn);
    expect(getDeviceRes.device.valueOff).toEqual(device.valueOff);
    expect(getDeviceRes.device.topicId).toEqual(topicRes.upsertTopic.id);

    const getDevicesRes = await executeOperation(GET_DEVICE_STUBS);
    expect(getDevicesRes.devices).toBeTruthy();
    expect(getDevicesRes.devices.length).toBeGreaterThan(0);
    expect(getDevicesRes.devices).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: deviceRes.upsertDevice.id, name: device.name, kind: device.kind }),
        ])
    );
});

test('create and update a device', async ({ executeOperation }) => {
    const topic = createTopicFactory();
    const topicRes = await executeOperation(UPSERT_TOPIC, { input: topic });
    expect(topicRes.upsertTopic).toBeTruthy();
    expect(topicRes.upsertTopic.id).toBeTypeOf('number');
    expect(topicRes.upsertTopic.id).toBeGreaterThan(0);
    expect(topicRes.upsertTopic.topic).toEqual(topic.topic);

    const device = createDeviceFactory({ topicId: topicRes.upsertTopic.id });
    const deviceRes = await executeOperation(UPSERT_DEVICE, { input: device });
    expect(deviceRes.upsertDevice).toBeTruthy();
    expect(deviceRes.upsertDevice.id).toBeTypeOf('number');
    expect(deviceRes.upsertDevice.id).toBeGreaterThan(0);
    expect(deviceRes.upsertDevice.name).toEqual(device.name);

    const getDeviceRes = await executeOperation(GET_DEVICE, { id: deviceRes.upsertDevice.id });
    expect(getDeviceRes.device).toBeTruthy();
    expect(getDeviceRes.device.id).toEqual(deviceRes.upsertDevice.id);
    expect(getDeviceRes.device.name).toEqual(device.name);
    expect(getDeviceRes.device.stateKey).toEqual(device.stateKey);
    expect(getDeviceRes.device.setKey).toEqual(device.setKey);
    expect(getDeviceRes.device.setSuffix).toEqual(device.setSuffix);
    expect(getDeviceRes.device.valueOn).toEqual(device.valueOn);
    expect(getDeviceRes.device.valueOff).toEqual(device.valueOff);
    expect(getDeviceRes.device.topicId).toEqual(topicRes.upsertTopic.id);

    const updatedDevice = createDeviceFactory({ id: deviceRes.upsertDevice.id, topicId: topicRes.upsertTopic.id });
    const updateRes = await executeOperation(UPSERT_DEVICE, { input: { ...updatedDevice, } });
    expect(updateRes.upsertDevice).toBeTruthy();
    expect(updateRes.upsertDevice.id).toEqual(deviceRes.upsertDevice.id);
    expect(updateRes.upsertDevice.name).toEqual(updatedDevice.name);

    const getUpdatedDeviceRes = await executeOperation(GET_DEVICE, { id: deviceRes.upsertDevice.id });
    expect(getUpdatedDeviceRes.device).toBeTruthy();
    expect(getUpdatedDeviceRes.device.id).toEqual(deviceRes.upsertDevice.id);
    expect(getUpdatedDeviceRes.device.name).toEqual(updatedDevice.name);
    expect(getUpdatedDeviceRes.device.stateKey).toEqual(updatedDevice.stateKey);
    expect(getUpdatedDeviceRes.device.setKey).toEqual(updatedDevice.setKey);
    expect(getUpdatedDeviceRes.device.setSuffix).toEqual(updatedDevice.setSuffix);
    expect(getUpdatedDeviceRes.device.valueOn).toEqual(updatedDevice.valueOn);
    expect(getUpdatedDeviceRes.device.valueOff).toEqual(updatedDevice.valueOff);
    expect(getUpdatedDeviceRes.device.topicId).toEqual(topicRes.upsertTopic.id);
});