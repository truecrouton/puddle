// Must be a 32-character (32-byte) string
const SECRET_KEY = process.env.SESSION_SECRET || 'default_secret_key_change_me_32_bytes!';

async function getCryptoKey() {
    const enc = new TextEncoder();
    // Ensure the key is exactly 32 bytes for AES-256
    const keyData = enc.encode(SECRET_KEY.padEnd(32, ' ').slice(0, 32));

    return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(payload: object): Promise<string> {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector for security
    const encoded = new TextEncoder().encode(JSON.stringify(payload));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    // Combine IV and ciphertext into a single buffer, then convert to base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
}

export async function decrypt<T = any>(token: string | undefined): Promise<T | null> {
    if (!token) return null;
    try {
        const key = await getCryptoKey();

        // Decode base64 back to binary
        const binaryStr = atob(token);
        const combined = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            combined[i] = binaryStr.charCodeAt(i);
        }

        const iv = combined.subarray(0, 12);
        const ciphertext = combined.subarray(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(decrypted)) as T;
    } catch (error) {
        // Decryption failed (tampered token, wrong key, or expired format)
        return null;
    }
}