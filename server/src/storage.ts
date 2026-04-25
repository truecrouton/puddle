import BetterSqllite3 from 'better-sqlite3';
import { addMinutes, format } from 'date-fns';
import { LRUCache } from 'lru-cache';
import { puddlePathRoot } from './path-anchor';

export interface Automation {
    id: number,
    name: string;
    position: "solarNoon" | "nadir" | "sunrise" | "sunset" | "sunriseEnd" | "sunsetStart" | "dawn" | "dusk" | "nauticalDawn" | "nauticalDusk" | "nightEnd" | "night" | "goldenHourEnd" | "goldenHour";
    trigger: "time" | "topic" | "sun" | "user";
    trigger_at: string;
    topic: string;
    trigger_key: string;
    trigger_value: string;
    is_control_shown: boolean;
    steps: AutomationStep[];
    conditions: [];
}

export interface AutomationStep {
    step_id: number,
    kind: "if" | "notify" | "publish" | "wait",
    conditional_step_id: number,
    is_else_step: boolean,
    topic_id: number,
    message: string;
}

export interface Chart {
    chart_id: number;
    topic_id: number;
    name: string;
    key: string;
}

export interface Device {
    device_id: number;
    topic_id: number,
    kind: "dimmable" | "informational" | "positionable" | "toggleable" | "unknown",
    set_key: string | null,
    state_key: string | null,
    set_suffix: string | null,
    value_on: string | null,
    value_off: string | null;
}

export interface DeviceStatusKey {
    status_key_id: number;
    device_id: number;
    name?: string;
    status_key: string;
    is_shown: boolean;
}

export interface Pair {
    topic_id: number,
    pair_id: number | null,
    name: string,
    value: string | number,
    is_object: boolean,
}

export interface Topic {
    topic_id: number;
    topic: string;
    description: string | null,
    [key: string]: string | number | null;
}

export interface User {
    user_id: number;
    username: string;
    is_admin: boolean;
}

export let db: BetterSqllite3.Database;
let lruCache = new LRUCache<string, number | string | string[]>({ max: 100000 });
let lastMessages: Map<string, { jsonString: string, count: number, created: string; }> = new Map();

export function cacheGet(topicId: number | bigint, name: string): string | number {
    return <string | number>lruCache.get(`${topicId}-${name}`);
}

export function cacheInit() {
    console.log('Loading cache with previously stored pairs');
    const latestPairStmt = db.prepare('SELECT MAX(created_at) FROM pairs WHERE topic_id=? AND is_object=0');
    const pairsStmt = db.prepare('SELECT pair_id, topic_id, name, value, created_at FROM pairs where topic_id=? AND created_at=? AND is_object=0 AND pair_id=0');

    const topics = <Topic[]>db.prepare('SELECT id as topic_id, topic from topics').all();
    for (const topic of topics) {
        const latestTimestamp = latestPairStmt.pluck().get(topic.topic_id);
        if (!latestTimestamp) continue;

        const pairs = <Pair[]>pairsStmt.all(topic.topic_id, latestTimestamp);
        pairs.forEach((pair) => {
            cacheSet(topic.topic_id, pair.name, pair.value, pair.pair_id || 0);
        });
    };
}

function cacheInvalidate(topicId: number | bigint) {
    const manifestKey = `${topicId}-*`;
    const manifest = <string[]>lruCache.get(manifestKey);
    if (!manifest) return;

    manifest.forEach((key) => {
        lruCache.delete(key);
    });
    lruCache.delete(manifestKey);
}

export function cachePairsGet(topicId: number | bigint): { name: string, value: string | number, pairId: number; }[] {
    const manifest = <string[]>lruCache.get(`${topicId}-*`);
    if (!manifest) return [];

    const split = manifest.map(m => m.split('-'));
    const pairs = split.map(s => ({ name: s[1], value: cacheGet(topicId, s[1]), pairId: s[2] ? Number(s[2]) : 0 }));

    return pairs;
};

function cacheSet(topicId: number | bigint, name: string, value: number | string, pairId: number | bigint = 0) {
    const key = pairId > 0 ? `${topicId}-${name}-${pairId}` : `${topicId}-${name}`;
    lruCache.set(key, value);

    const manifestKey = `${topicId}-*`;
    const manifest = <string[]>lruCache.get(manifestKey) || [];
    if (!manifest.includes(key)) {
        lruCache.set(manifestKey, [...manifest, key]);
    }
}

export function sqliteDate(offsetToUtc: boolean, date?: Date): string {
    const dateFormat = 'yyyy-MM-dd HH:mm:ss';
    const originalDate = date ?? new Date();
    return offsetToUtc ? format(addMinutes(originalDate, originalDate.getTimezoneOffset()), dateFormat) : format(originalDate, dateFormat);
}

export function storageInit(options?: BetterSqllite3.Options): BetterSqllite3.Database {
    db = new BetterSqllite3(`${puddlePathRoot}/../data/puddle.sqlite`, options);
    db.pragma('journal_mode = WAL');

    return db;
};

export function storeMessage(topic: string, jsonString: string, creationDate?: Date): number {
    let topicId: number | bigint = 0;
    const created = creationDate ? sqliteDate(true, creationDate) : sqliteDate(true);

    db.transaction(() => {
        const topicRes = db.prepare('INSERT OR IGNORE INTO topics (topic) VALUES(?)').run(topic);
        if (topicRes.changes === 0) {
            const storedTopic = <Topic>db.prepare('SELECT id as topic_id FROM topics where topic=?').get(topic);
            topicId = storedTopic.topic_id;
        }
        else {
            topicId = topicRes.lastInsertRowid;
        }

        const lastMessage = lastMessages.get(topic);
        if (lastMessage) {
            if (lastMessage.jsonString === jsonString) {
                lastMessage.count++;
                lastMessage.created = created;
                lastMessages.set(topic, lastMessage);
                return topicId;
            }
            else if (lastMessage.count > 1) {
                cacheInvalidate(topicId);

                const lastJson = JSON.parse(lastMessage.jsonString);
                Object.keys(lastJson).forEach((k) => {
                    storePair(topicId, 0, k, lastJson[k], lastMessage.created);
                });
            }
        }
        lastMessages.set(topic, { count: 1, jsonString, created });

        cacheInvalidate(topicId);

        try {
            const json = JSON.parse(jsonString);

            Object.keys(json).forEach((k) => {
                storePair(topicId, 0, k, json[k], created);
            });
        }
        catch (error) {
            topicId = 0;
        }
    })();

    return topicId;
}

function storePair(topicId: number | bigint, pairId: number | bigint, name: string, value: any, created: string) {
    if (value === null) return;

    const pairStmt = db.prepare('INSERT INTO pairs (topic_id, pair_id, name, value, is_object, created_at) VALUES(?, ?, ?, ?, ?, ?)');

    if (typeof value === 'object') {
        const pairRes = pairStmt.run(topicId, pairId, name, '', 1, created);

        Object.keys(value).forEach((k) => {
            storePair(topicId, pairRes.lastInsertRowid, k, value[k], created);
        });
    }
    else {
        const normValue = typeof value === 'boolean' ? value ? 1 : 0 : value;
        // Don't store nested json in cache
        if (!pairId) cacheSet(topicId, name, normValue);
        pairStmt.run(topicId, pairId, name, normValue, 0, created);
    }
}

export function validateSession(sessionId: string): { userId: number, isAdmin: boolean; } | undefined {
    const user: any = db.prepare('SELECT id AS user_id, is_admin FROM users WHERE session_id=?').get(sessionId);

    return user ? { userId: user.user_id, isAdmin: user.is_admin === 1 } : undefined;
}