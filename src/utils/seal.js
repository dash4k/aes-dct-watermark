const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const ITERATIONS = 600_000;

const deriveKey = async (password, salt) => {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};


const aes256gcm = () => {
    const seal = async (password, text) => {
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
      const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
      const key = await deriveKey(password, salt);
    
      const ct = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv, tagLength: 128 },
          key,
          new TextEncoder().encode(text)
        )
      );
    
      const out = new Uint8Array(SALT_LEN + IV_LEN + ct.length);
      out.set(salt, 0);
      out.set(iv, SALT_LEN);
      out.set(ct, SALT_LEN + IV_LEN);
      return out;
    };
    
    
    const open = async (password, bytes) => {
      if (bytes.length < SALT_LEN + IV_LEN + TAG_LEN) return null;
    
      const salt = bytes.slice(0, SALT_LEN);
      const iv = bytes.slice(SALT_LEN, SALT_LEN + IV_LEN);
      const ct = bytes.slice(SALT_LEN + IV_LEN);
    
      try {
        const key = await deriveKey(password, salt);
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ct);
        return new TextDecoder().decode(pt);
      } catch {
        return null;
      }
    };


    return {
        seal,
        open,
    }
}


export default aes256gcm;