const ACCOUNT_PREFIX = "campuslink:demo-account:";
const HASH_ITERATIONS = 120_000;

function normalizedEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((pair) => Number.parseInt(pair, 16)));
}

async function derivePasswordHash(password, salt) {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Password protection is not available in this browser. Open the app on localhost or HTTPS.");
  }
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: HASH_ITERATIONS }, material, 256);
  return new Uint8Array(bits);
}

export async function saveDemoAccount(registration) {
  const email = normalizedEmail(registration.email);
  if (!email) throw new Error("An email is required to save this account.");
  const key = `${ACCOUNT_PREFIX}${email}`;
  if (localStorage.getItem(key)) throw new Error("An account already exists for this email. Log in instead.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await derivePasswordHash(registration.password, salt);
  const profile = { ...registration };
  delete profile.password;
  delete profile.confirmPassword;
  localStorage.setItem(key, JSON.stringify({ profile: { ...profile, email }, salt: bytesToHex(salt), passwordHash: bytesToHex(passwordHash), iterations: HASH_ITERATIONS, createdAt: new Date().toISOString() }));
}

export async function authenticateDemoAccount(emailInput, password) {
  const email = normalizedEmail(emailInput);
  const stored = localStorage.getItem(`${ACCOUNT_PREFIX}${email}`);
  if (!stored) throw new Error("No account was found for that email. Register and verify it first.");
  let account;
  try {
    account = JSON.parse(stored);
  } catch {
    throw new Error("This saved demo account is unreadable. Register again to create a fresh one.");
  }
  const candidateHash = await derivePasswordHash(password, hexToBytes(account.salt));
  const savedHash = hexToBytes(account.passwordHash);
  const matches = candidateHash.length === savedHash.length && candidateHash.every((byte, index) => byte === savedHash[index]);
  if (!matches) throw new Error("The email or password is incorrect.");
  return account.profile;
}
