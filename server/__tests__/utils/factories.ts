// src/utils/factories.ts
import { rand, randAccessory, randVerb, randWord, randFullName, randUserName } from '@ngneat/falso';
import { Device, Topic, User } from 'puddle-graphql';

export function createDeviceFactory(override: Partial<Device> = {}): Device {
    const kinds = ['toggleable', 'positionable'];
    return {
        id: 0,
        topicId: 1,
        kind: rand(kinds),
        name: randAccessory(),
        stateKey: randWord().toLowerCase(),
        setKey: randWord().toLowerCase(),
        setSuffix: randVerb().toLowerCase().replace(' ', '_'),
        valueOn: randVerb().toUpperCase().replace(' ', '_'),
        valueOff: randVerb().toUpperCase().replace(' ', '_'),
        ...override,
    };
}

export function createTopicFactory(override: Partial<Topic> = {}): Topic {
    return {
        id: 0,
        topic: `zigbee2mqtt/${randWord().toLowerCase()}/${randWord().toLowerCase()}`
    };
}

export function createUserFactory(override: Partial<User> = {}): User {
    return {
        id: 0,
        username: randUserName().toLocaleLowerCase(),
        password: 'Passw0rd!',
        isAdmin: true,
        name: randFullName()
    };
}