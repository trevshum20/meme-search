// src/storage/localImageStore.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// 10MB/file; field name "memes"
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

class LocalImageStore {
  constructor(opts = {}) {
    this.root = path.resolve(
  opts.root || process.env.IMAGES_ROOT || path.join(process.cwd(), 'var/images')
);

    // Where images are served from in your Express app
    this.routePrefix = (opts.routePrefix || '/images').replace(/\/+$/, '');

    this.publicBaseUrl = (
      opts.publicBaseUrl ||
      process.env.PUBLIC_BASE_URL ||
      ''
    ).replace(/\/$/, '');

    fs.mkdirSync(this.root, { recursive: true });
  }

  /** ---------------- Internal helpers ---------------- */

  // Prevent path traversal, normalize separators
  sanitizeKey(key) {
    const norm = path.posix.normalize(String(key).replace(/\\/g, '/'));
    if (norm.startsWith('..')) throw new Error('Invalid key');
    return norm;
  }

  // Extract a key from a full URL like http://host/images/2025%2F08%2Fu.png
  keyFromUrl(url) {
    let u;
    try {
      u = new URL(url);
    } catch {
      throw new Error('Invalid image URL');
    }
    const { pathname } = u;
    if (!pathname.startsWith(this.routePrefix + '/')) {
      throw new Error('Invalid image URL format');
    }
    const encodedKey = pathname.slice(this.routePrefix.length + 1);
    const decodedKey = decodeURIComponent(encodedKey);
    return this.sanitizeKey(decodedKey);
  }

  // Accept either a key or a full URL; return a safe normalized key
  keyFromUrlOrKey(input) {
    if (/^https?:\/\//i.test(String(input))) {
      return this.keyFromUrl(input);
    }
    return this.sanitizeKey(input);
  }

  /** ---------------- Public API ---------------- */

  /**
   * Save a readable stream to disk under the provided key
   * Returns { key, bytes, sha256 }
   */
  async save(readable, key) {
    const safeKey = this.sanitizeKey(key);
    const target = path.join(this.root, safeKey);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    const hash = crypto.createHash('sha256');
    let bytes = 0;

    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(target, { flags: 'w', mode: 0o644 });
      readable.on('data', (chunk) => {
        bytes += chunk.length;
        hash.update(chunk);
      });
      readable.on('error', reject);
      out.on('error', reject);
      out.on('finish', resolve);
      readable.pipe(out);
    });

    const sha256 = hash.digest('hex');
    return { key: safeKey, bytes, sha256 };
  }

  /**
   * Create a readable stream for the stored file (accepts URL or key)
   */
  get(urlOrKey) {
    const key = this.keyFromUrlOrKey(urlOrKey);
    return fs.createReadStream(path.join(this.root, key));
  }

  /**
   * Delete the stored file (accepts URL or key; ENOENT is ignored)
   */
  async delete(urlOrKey) {
    const key = this.keyFromUrlOrKey(urlOrKey);
    const p = path.join(this.root, key);
    try {
      await fs.promises.unlink(p);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }

  /**
   * Build a public URL for the file (served by Express static)
   */
    url(key) {
    const safeKey = this.sanitizeKey(key);
    const encoded = safeKey
        .split('/')
        .map(seg => encodeURIComponent(seg))
        .join('/');
    const suffix = `${this.routePrefix}/${encoded}`;
    return this.publicBaseUrl ? `${this.publicBaseUrl}${suffix}` : suffix;
    }

  // Prefer original extension; fall back to mimetype
  pickExt(file) {
    const extFromName = path.extname(file.originalname || '').toLowerCase();
    if (extFromName) return extFromName;

    const m = (file.mimetype || '').toLowerCase();
    if (m.includes('png')) return '.png';
    if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
    if (m.includes('gif')) return '.gif';
    if (m.includes('webp')) return '.webp';
    return '';
  }
}

module.exports = { LocalImageStore, uploadMiddleware };
