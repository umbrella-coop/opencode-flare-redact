#!/usr/bin/env node

// src/cli.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { resolve } from "node:path";

// src/hook.ts
import { appendFileSync } from "node:fs";

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/i18n.js
var SECRET_KEYWORDS = Array.from(new Set([
  // 1. English
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "api-key",
  "access_key",
  "access-key",
  "accesskey",
  "secret_key",
  "client_secret",
  "private_key",
  "privatekey",
  "credential",
  "credentials",
  "auth_token",
  "passphrase",
  // 2. Chinese
  "\u5BC6\u7801",
  "\u5BC6\u78BC",
  "\u79D8\u5BC6",
  "\u4EE4\u724C",
  "\u5BC6\u94A5",
  "\u79C1\u94A5",
  "\u53E3\u4EE4",
  // 3. Hindi
  "\u092A\u093E\u0938\u0935\u0930\u094D\u0921",
  "\u0917\u0941\u092A\u094D\u0924",
  "\u0915\u0941\u0902\u091C\u0940",
  "\u091F\u094B\u0915\u0928",
  // 4. Spanish
  "contrase\xF1a",
  "contrasena",
  "clave",
  "secreto",
  "credencial",
  // 5. Arabic
  "\u0643\u0644\u0645\u0629\u0627\u0644\u0645\u0631\u0648\u0631",
  "\u0643\u0644\u0645\u0629\u0627\u0644\u0633\u0631",
  "\u0633\u0631",
  "\u0631\u0645\u0632",
  "\u0645\u0641\u062A\u0627\u062D",
  "\u0633\u0631\u064A",
  // 6. French
  "motdepasse",
  "mot_de_passe",
  "motdepass",
  "cl\xE9",
  "clef",
  "cl\xE9secr\xE8te",
  "secret",
  // 7. Portuguese
  "senha",
  "segredo",
  "chavesecreta",
  "chave",
  // 8. Russian
  "\u043F\u0430\u0440\u043E\u043B\u044C",
  "\u0441\u0435\u043A\u0440\u0435\u0442",
  "\u0442\u043E\u043A\u0435\u043D",
  "\u043A\u043B\u044E\u0447",
  "\u0441\u0435\u043A\u0440\u0435\u0442\u043D\u044B\u0439\u043A\u043B\u044E\u0447",
  // 9. Japanese
  "\u30D1\u30B9\u30EF\u30FC\u30C9",
  "\u79D8\u5BC6",
  "\u30C8\u30FC\u30AF\u30F3",
  "\u6697\u8A3C\u756A\u53F7",
  "\u5408\u8A00\u8449",
  // 10. German
  "passwort",
  "kennwort",
  "geheimnis",
  "geheim",
  "schl\xFCssel",
  "schluessel",
  "zugangsschl\xFCssel",
  // 11. Korean
  "\uBE44\uBC00\uBC88\uD638",
  "\uC554\uD638",
  "\uBE44\uBC00",
  "\uD1A0\uD070",
  "\uBE44\uBC00\uD0A4",
  // 12. Turkish
  "\u015Fifre",
  "sifre",
  "parola",
  "gizli",
  "anahtar",
  "gizlianahtar",
  // 13. Italian
  "segreto",
  "chiave",
  "parolachiave",
  "parola_chiave",
  "credenziale",
  // 14. Persian
  "\u0631\u0645\u0632",
  "\u0631\u0645\u0632\u0639\u0628\u0648\u0631",
  "\u06AF\u0630\u0631\u0648\u0627\u0698\u0647",
  "\u06A9\u0644\u0645\u0647\u0639\u0628\u0648\u0631",
  "\u06A9\u0644\u06CC\u062F",
  "\u0645\u062D\u0631\u0645\u0627\u0646\u0647",
  // 15. Polish
  "has\u0142o",
  "haslo",
  "tajne",
  "klucz",
  "poufne",
  // 16. Ukrainian
  "\u043F\u0430\u0440\u043E\u043B\u044C",
  "\u0441\u0435\u043A\u0440\u0435\u0442",
  "\u043A\u043B\u044E\u0447",
  "\u0442\u0430\u0454\u043C\u043D\u0438\u0439",
  // 17. Dutch
  "wachtwoord",
  "geheim",
  "sleutel",
  // 18. Vietnamese
  "matkhau",
  "mat_khau",
  "bimat",
  "khoa",
  // 19. Indonesian
  "katasandi",
  "kata_sandi",
  "sandi",
  "rahasia",
  "kunci",
  // 20. Thai
  "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
  "\u0E04\u0E27\u0E32\u0E21\u0E25\u0E31\u0E1A",
  // 21. Greek
  "\u03BA\u03C9\u03B4\u03B9\u03BA\u03CC\u03C2",
  "\u03BC\u03C5\u03C3\u03C4\u03B9\u03BA\u03CC",
  "\u03BA\u03BB\u03B5\u03B9\u03B4\u03AF",
  // 22. Hebrew
  "\u05E1\u05D9\u05E1\u05DE\u05D4",
  "\u05E1\u05D5\u05D3",
  "\u05DE\u05E4\u05EA\u05D7",
  // 23. Azerbaijani
  "\u015Fifr\u0259",
  "parol",
  "gizli",
  "a\xE7ar",
  "m\u0259xfi",
  // 24. Romanian
  "parol\u0103",
  "parola",
  "cheie"
].map((w) => w.toLowerCase())));
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function keywordAlternation() {
  return [...SECRET_KEYWORDS].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
}
function assignmentPattern() {
  return new RegExp(`(?:${keywordAlternation()})["'\\s]*[:=]\\s*["']?([^\\s"',;]{4,})["']?`, "giu");
}
var MULTILANG_KEY_SET = new Set(SECRET_KEYWORDS);

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/checksums.js
var onlyDigits = (s) => s.replace(/\D/g, "");
function luhnCheck(value) {
  const d = onlyDigits(value);
  if (d.length < 2)
    return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9)
        n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function ibanValid(value) {
  const iban = value.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban))
    return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (let i = 0; i < code.length; i++) {
      remainder = (remainder * 10 + (code.charCodeAt(i) - 48)) % 97;
    }
  }
  return remainder === 1;
}
function tcknValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 11 || d[0] === "0")
    return false;
  const n = d.split("").map(Number);
  const odd = n[0] + n[2] + n[4] + n[6] + n[8];
  const even = n[1] + n[3] + n[5] + n[7];
  if (((odd * 7 - even) % 10 + 10) % 10 !== n[9])
    return false;
  const sum10 = n.slice(0, 10).reduce((a, b) => a + b, 0);
  return sum10 % 10 === n[10];
}
function cpfValid(value) {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c))
    return false;
  const digit = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++)
      sum += Number(c[i]) * (len + 1 - i);
    const r = sum * 10 % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(c[9]) && digit(10) === Number(c[10]);
}
var DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
function dniValid(value) {
  const m = value.toUpperCase().replace(/[\s-]/g, "").match(/^([XYZ]?)(\d{7,8})([A-Z])$/);
  if (!m)
    return false;
  const prefix = m[1] ? String("XYZ".indexOf(m[1])) : "";
  const n = parseInt(prefix + m[2], 10);
  return DNI_LETTERS[n % 23] === m[3];
}
function bsnValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 9 || d === "000000000")
    return false;
  let sum = 0;
  for (let i = 0; i < 8; i++)
    sum += Number(d[i]) * (9 - i);
  sum += Number(d[8]) * -1;
  return sum % 11 === 0;
}
function peselValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 11)
    return false;
  const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++)
    sum += Number(d[i]) * w[i];
  return (10 - sum % 10) % 10 === Number(d[10]);
}
function deTaxIdValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 11)
    return false;
  let product = 10;
  for (let i = 0; i < 10; i++) {
    let sum = (Number(d[i]) + product) % 10;
    if (sum === 0)
      sum = 10;
    product = sum * 2 % 11;
  }
  const check = (11 - product) % 10;
  return check === Number(d[10]);
}
function abaValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 9)
    return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 3) {
    sum += 3 * Number(d[i]) + 7 * Number(d[i + 1]) + Number(d[i + 2]);
  }
  return sum !== 0 && sum % 10 === 0;
}
function nhsValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 10 || /^(\d)\1{9}$/.test(d))
    return false;
  let sum = 0;
  for (let i = 0; i < 9; i++)
    sum += Number(d[i]) * (10 - i);
  let check = 11 - sum % 11;
  if (check === 11)
    check = 0;
  if (check === 10)
    return false;
  return check === Number(d[9]);
}
var VIN_TRANS = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9
};
var VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function vinValid(value) {
  const v = value.toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v))
    return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = v[i];
    const t = c >= "0" && c <= "9" ? Number(c) : VIN_TRANS[c];
    if (t === void 0)
      return false;
    sum += t * VIN_WEIGHTS[i];
  }
  const check = sum % 11;
  return v[8] === (check === 10 ? "X" : String(check));
}
function ssnValid(value) {
  const m = value.match(/^(\d{3})-?(\d{2})-?(\d{4})$/);
  if (!m)
    return false;
  const area = Number(m[1]);
  const group = Number(m[2]);
  const serial = Number(m[3]);
  if (area === 0 || area === 666 || area >= 900)
    return false;
  return group !== 0 && serial !== 0;
}
function frNirValid(value) {
  const nir = value.replace(/[\s.-]/g, "").toUpperCase();
  const m = nir.match(/^([12]\d{4})(\d{2}|2[AB])(\d{6})(\d{2})$/);
  if (!m)
    return false;
  const dept = m[2] === "2A" ? "19" : m[2] === "2B" ? "18" : m[2];
  const n = Number(m[1] + dept + m[3]);
  const key = 97 - n % 97;
  return key === Number(m[4]);
}
var VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
var VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
function aadhaarValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 12 || d[0] === "0" || d[0] === "1")
    return false;
  let c = 0;
  for (let i = 0; i < 12; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][Number(d[11 - i])]];
  }
  return c === 0;
}
var TFN_WEIGHTS = [1, 4, 3, 7, 5, 8, 6, 9, 10];
function tfnValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 9 || /^(\d)\1{8}$/.test(d))
    return false;
  let sum = 0;
  for (let i = 0; i < 9; i++)
    sum += Number(d[i]) * TFN_WEIGHTS[i];
  return sum % 11 === 0;
}
var CN_ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
var CN_ID_CHECK = "10X98765432";
function cnResidentIdValid(value) {
  const id = value.toUpperCase();
  if (!/^[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(id))
    return false;
  let sum = 0;
  for (let i = 0; i < 17; i++)
    sum += Number(id[i]) * CN_ID_WEIGHTS[i];
  return CN_ID_CHECK[sum % 11] === id[17];
}
function jpMyNumberValid(value) {
  const d = onlyDigits(value);
  if (d.length !== 12)
    return false;
  let sum = 0;
  for (let n = 1; n <= 11; n++) {
    const digit = Number(d[11 - n]);
    sum += digit * (n <= 6 ? n + 1 : n - 5);
  }
  const r = sum % 11;
  const check = r <= 1 ? 0 : 11 - r;
  return check === Number(d[11]);
}
var CF_ODD = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23
};
function codiceFiscaleValid(value) {
  const cf = value.toUpperCase();
  if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf))
    return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = cf[i];
    if (i % 2 === 0) {
      sum += CF_ODD[ch];
    } else {
      const even = ch >= "0" && ch <= "9" ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 65;
      sum += even;
    }
  }
  return String.fromCharCode(65 + sum % 26) === cf[15];
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/locales.js
var mask = () => "[REDACTED ID]";
var LOCALE_DETECTORS = [
  {
    id: "iban",
    label: "IBAN",
    why: "An international bank account number.",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    validate: ibanValid,
    mask: () => "[REDACTED IBAN]",
    default: true,
    tags: ["pii", "finance"]
  },
  {
    id: "tr_tckn",
    label: "Turkish national ID (TCKN)",
    why: "Turkey T.C. Kimlik No \u2014 a national identifier.",
    pattern: /\b[1-9]\d{10}\b/g,
    validate: tcknValid,
    mask,
    default: false,
    tags: ["pii", "id", "tr"]
  },
  {
    id: "br_cpf",
    label: "Brazilian CPF",
    why: "Brazil taxpayer registry number \u2014 high-value PII.",
    pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    validate: cpfValid,
    mask,
    default: false,
    tags: ["pii", "id", "br"]
  },
  {
    id: "es_dni",
    label: "Spanish DNI / NIE",
    why: "Spain national identity / foreigner number.",
    pattern: /\b[XYZ]?\d{7,8}[A-Za-z]\b/g,
    validate: dniValid,
    mask,
    default: false,
    tags: ["pii", "id", "es"]
  },
  {
    id: "nl_bsn",
    label: "Dutch BSN",
    why: "Netherlands citizen service number.",
    pattern: /\b\d{9}\b/g,
    validate: bsnValid,
    mask,
    default: false,
    tags: ["pii", "id", "nl"]
  },
  {
    id: "pl_pesel",
    label: "Polish PESEL",
    why: "Poland national identification number.",
    pattern: /\b\d{11}\b/g,
    validate: peselValid,
    mask,
    default: false,
    tags: ["pii", "id", "pl"]
  },
  {
    id: "de_tax_id",
    label: "German tax ID (Steuer-IdNr)",
    why: "Germany tax identification number.",
    pattern: /\b\d{11}\b/g,
    validate: deTaxIdValid,
    mask,
    default: false,
    tags: ["pii", "id", "de"]
  },
  {
    id: "it_codice_fiscale",
    label: "Italian Codice Fiscale",
    why: "Italy fiscal code \u2014 a national identifier.",
    pattern: /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi,
    validate: codiceFiscaleValid,
    mask,
    default: false,
    tags: ["pii", "id", "it"]
  },
  {
    id: "ca_sin",
    label: "Canadian SIN",
    why: "Canada social insurance number.",
    pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
    validate: luhnCheck,
    mask,
    default: false,
    tags: ["pii", "id", "ca"]
  },
  {
    id: "fr_nir",
    label: "French NIR (num\xE9ro de s\xE9curit\xE9 sociale)",
    why: "France INSEE social security number.",
    pattern: /\b[12][\s.]?\d{2}[\s.]?\d{2}[\s.]?(?:\d{2}|2[AB])[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{2}\b/gi,
    validate: frNirValid,
    mask,
    default: false,
    tags: ["pii", "id", "fr"]
  },
  {
    id: "in_aadhaar",
    label: "Indian Aadhaar number",
    why: "India biometric-linked national identifier.",
    pattern: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    validate: aadhaarValid,
    mask,
    default: false,
    tags: ["pii", "id", "in"]
  },
  {
    id: "au_tfn",
    label: "Australian TFN",
    why: "Australia tax file number.",
    pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,
    validate: tfnValid,
    mask,
    default: false,
    tags: ["pii", "id", "au"]
  },
  {
    id: "cn_resident_id",
    label: "Chinese resident ID",
    why: "China resident identity card number.",
    pattern: /\b[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g,
    validate: cnResidentIdValid,
    mask,
    default: false,
    tags: ["pii", "id", "cn"]
  },
  {
    id: "jp_my_number",
    label: "Japanese My Number",
    why: "Japan individual number for tax and social security.",
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    validate: jpMyNumberValid,
    mask,
    default: false,
    tags: ["pii", "id", "jp"]
  },
  {
    id: "us_ssn",
    label: "US Social Security number",
    why: "A US national identifier \u2014 high-value PII.",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    validate: ssnValid,
    mask,
    default: false,
    tags: ["pii", "id", "us"]
  }
];

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/bip39.js
var BIP39_WORDS = /* @__PURE__ */ new Set([
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "absent",
  "absorb",
  "abstract",
  "absurd",
  "abuse",
  "access",
  "accident",
  "account",
  "accuse",
  "achieve",
  "acid",
  "acoustic",
  "acquire",
  "across",
  "act",
  "action",
  "actor",
  "actress",
  "actual",
  "adapt",
  "add",
  "addict",
  "address",
  "adjust",
  "admit",
  "adult",
  "advance",
  "advice",
  "aerobic",
  "affair",
  "afford",
  "afraid",
  "again",
  "age",
  "agent",
  "agree",
  "ahead",
  "aim",
  "air",
  "airport",
  "aisle",
  "alarm",
  "album",
  "alcohol",
  "alert",
  "alien",
  "all",
  "alley",
  "allow",
  "almost",
  "alone",
  "alpha",
  "already",
  "also",
  "alter",
  "always",
  "amateur",
  "amazing",
  "among",
  "amount",
  "amused",
  "analyst",
  "anchor",
  "ancient",
  "anger",
  "angle",
  "angry",
  "animal",
  "ankle",
  "announce",
  "annual",
  "another",
  "answer",
  "antenna",
  "antique",
  "anxiety",
  "any",
  "apart",
  "apology",
  "appear",
  "apple",
  "approve",
  "april",
  "arch",
  "arctic",
  "area",
  "arena",
  "argue",
  "arm",
  "armed",
  "armor",
  "army",
  "around",
  "arrange",
  "arrest",
  "arrive",
  "arrow",
  "art",
  "artefact",
  "artist",
  "artwork",
  "ask",
  "aspect",
  "assault",
  "asset",
  "assist",
  "assume",
  "asthma",
  "athlete",
  "atom",
  "attack",
  "attend",
  "attitude",
  "attract",
  "auction",
  "audit",
  "august",
  "aunt",
  "author",
  "auto",
  "autumn",
  "average",
  "avocado",
  "avoid",
  "awake",
  "aware",
  "away",
  "awesome",
  "awful",
  "awkward",
  "axis",
  "baby",
  "bachelor",
  "bacon",
  "badge",
  "bag",
  "balance",
  "balcony",
  "ball",
  "bamboo",
  "banana",
  "banner",
  "bar",
  "barely",
  "bargain",
  "barrel",
  "base",
  "basic",
  "basket",
  "battle",
  "beach",
  "bean",
  "beauty",
  "because",
  "become",
  "beef",
  "before",
  "begin",
  "behave",
  "behind",
  "believe",
  "below",
  "belt",
  "bench",
  "benefit",
  "best",
  "betray",
  "better",
  "between",
  "beyond",
  "bicycle",
  "bid",
  "bike",
  "bind",
  "biology",
  "bird",
  "birth",
  "bitter",
  "black",
  "blade",
  "blame",
  "blanket",
  "blast",
  "bleak",
  "bless",
  "blind",
  "blood",
  "blossom",
  "blouse",
  "blue",
  "blur",
  "blush",
  "board",
  "boat",
  "body",
  "boil",
  "bomb",
  "bone",
  "bonus",
  "book",
  "boost",
  "border",
  "boring",
  "borrow",
  "boss",
  "bottom",
  "bounce",
  "box",
  "boy",
  "bracket",
  "brain",
  "brand",
  "brass",
  "brave",
  "bread",
  "breeze",
  "brick",
  "bridge",
  "brief",
  "bright",
  "bring",
  "brisk",
  "broccoli",
  "broken",
  "bronze",
  "broom",
  "brother",
  "brown",
  "brush",
  "bubble",
  "buddy",
  "budget",
  "buffalo",
  "build",
  "bulb",
  "bulk",
  "bullet",
  "bundle",
  "bunker",
  "burden",
  "burger",
  "burst",
  "bus",
  "business",
  "busy",
  "butter",
  "buyer",
  "buzz",
  "cabbage",
  "cabin",
  "cable",
  "cactus",
  "cage",
  "cake",
  "call",
  "calm",
  "camera",
  "camp",
  "can",
  "canal",
  "cancel",
  "candy",
  "cannon",
  "canoe",
  "canvas",
  "canyon",
  "capable",
  "capital",
  "captain",
  "car",
  "carbon",
  "card",
  "cargo",
  "carpet",
  "carry",
  "cart",
  "case",
  "cash",
  "casino",
  "castle",
  "casual",
  "cat",
  "catalog",
  "catch",
  "category",
  "cattle",
  "caught",
  "cause",
  "caution",
  "cave",
  "ceiling",
  "celery",
  "cement",
  "census",
  "century",
  "cereal",
  "certain",
  "chair",
  "chalk",
  "champion",
  "change",
  "chaos",
  "chapter",
  "charge",
  "chase",
  "chat",
  "cheap",
  "check",
  "cheese",
  "chef",
  "cherry",
  "chest",
  "chicken",
  "chief",
  "child",
  "chimney",
  "choice",
  "choose",
  "chronic",
  "chuckle",
  "chunk",
  "churn",
  "cigar",
  "cinnamon",
  "circle",
  "citizen",
  "city",
  "civil",
  "claim",
  "clap",
  "clarify",
  "claw",
  "clay",
  "clean",
  "clerk",
  "clever",
  "click",
  "client",
  "cliff",
  "climb",
  "clinic",
  "clip",
  "clock",
  "clog",
  "close",
  "cloth",
  "cloud",
  "clown",
  "club",
  "clump",
  "cluster",
  "clutch",
  "coach",
  "coast",
  "coconut",
  "code",
  "coffee",
  "coil",
  "coin",
  "collect",
  "color",
  "column",
  "combine",
  "come",
  "comfort",
  "comic",
  "common",
  "company",
  "concert",
  "conduct",
  "confirm",
  "congress",
  "connect",
  "consider",
  "control",
  "convince",
  "cook",
  "cool",
  "copper",
  "copy",
  "coral",
  "core",
  "corn",
  "correct",
  "cost",
  "cotton",
  "couch",
  "country",
  "couple",
  "course",
  "cousin",
  "cover",
  "coyote",
  "crack",
  "cradle",
  "craft",
  "cram",
  "crane",
  "crash",
  "crater",
  "crawl",
  "crazy",
  "cream",
  "credit",
  "creek",
  "crew",
  "cricket",
  "crime",
  "crisp",
  "critic",
  "crop",
  "cross",
  "crouch",
  "crowd",
  "crucial",
  "cruel",
  "cruise",
  "crumble",
  "crunch",
  "crush",
  "cry",
  "crystal",
  "cube",
  "culture",
  "cup",
  "cupboard",
  "curious",
  "current",
  "curtain",
  "curve",
  "cushion",
  "custom",
  "cute",
  "cycle",
  "dad",
  "damage",
  "damp",
  "dance",
  "danger",
  "daring",
  "dash",
  "daughter",
  "dawn",
  "day",
  "deal",
  "debate",
  "debris",
  "decade",
  "december",
  "decide",
  "decline",
  "decorate",
  "decrease",
  "deer",
  "defense",
  "define",
  "defy",
  "degree",
  "delay",
  "deliver",
  "demand",
  "demise",
  "denial",
  "dentist",
  "deny",
  "depart",
  "depend",
  "deposit",
  "depth",
  "deputy",
  "derive",
  "describe",
  "desert",
  "design",
  "desk",
  "despair",
  "destroy",
  "detail",
  "detect",
  "develop",
  "device",
  "devote",
  "diagram",
  "dial",
  "diamond",
  "diary",
  "dice",
  "diesel",
  "diet",
  "differ",
  "digital",
  "dignity",
  "dilemma",
  "dinner",
  "dinosaur",
  "direct",
  "dirt",
  "disagree",
  "discover",
  "disease",
  "dish",
  "dismiss",
  "disorder",
  "display",
  "distance",
  "divert",
  "divide",
  "divorce",
  "dizzy",
  "doctor",
  "document",
  "dog",
  "doll",
  "dolphin",
  "domain",
  "donate",
  "donkey",
  "donor",
  "door",
  "dose",
  "double",
  "dove",
  "draft",
  "dragon",
  "drama",
  "drastic",
  "draw",
  "dream",
  "dress",
  "drift",
  "drill",
  "drink",
  "drip",
  "drive",
  "drop",
  "drum",
  "dry",
  "duck",
  "dumb",
  "dune",
  "during",
  "dust",
  "dutch",
  "duty",
  "dwarf",
  "dynamic",
  "eager",
  "eagle",
  "early",
  "earn",
  "earth",
  "easily",
  "east",
  "easy",
  "echo",
  "ecology",
  "economy",
  "edge",
  "edit",
  "educate",
  "effort",
  "egg",
  "eight",
  "either",
  "elbow",
  "elder",
  "electric",
  "elegant",
  "element",
  "elephant",
  "elevator",
  "elite",
  "else",
  "embark",
  "embody",
  "embrace",
  "emerge",
  "emotion",
  "employ",
  "empower",
  "empty",
  "enable",
  "enact",
  "end",
  "endless",
  "endorse",
  "enemy",
  "energy",
  "enforce",
  "engage",
  "engine",
  "enhance",
  "enjoy",
  "enlist",
  "enough",
  "enrich",
  "enroll",
  "ensure",
  "enter",
  "entire",
  "entry",
  "envelope",
  "episode",
  "equal",
  "equip",
  "era",
  "erase",
  "erode",
  "erosion",
  "error",
  "erupt",
  "escape",
  "essay",
  "essence",
  "estate",
  "eternal",
  "ethics",
  "evidence",
  "evil",
  "evoke",
  "evolve",
  "exact",
  "example",
  "excess",
  "exchange",
  "excite",
  "exclude",
  "excuse",
  "execute",
  "exercise",
  "exhaust",
  "exhibit",
  "exile",
  "exist",
  "exit",
  "exotic",
  "expand",
  "expect",
  "expire",
  "explain",
  "expose",
  "express",
  "extend",
  "extra",
  "eye",
  "eyebrow",
  "fabric",
  "face",
  "faculty",
  "fade",
  "faint",
  "faith",
  "fall",
  "false",
  "fame",
  "family",
  "famous",
  "fan",
  "fancy",
  "fantasy",
  "farm",
  "fashion",
  "fat",
  "fatal",
  "father",
  "fatigue",
  "fault",
  "favorite",
  "feature",
  "february",
  "federal",
  "fee",
  "feed",
  "feel",
  "female",
  "fence",
  "festival",
  "fetch",
  "fever",
  "few",
  "fiber",
  "fiction",
  "field",
  "figure",
  "file",
  "film",
  "filter",
  "final",
  "find",
  "fine",
  "finger",
  "finish",
  "fire",
  "firm",
  "first",
  "fiscal",
  "fish",
  "fit",
  "fitness",
  "fix",
  "flag",
  "flame",
  "flash",
  "flat",
  "flavor",
  "flee",
  "flight",
  "flip",
  "float",
  "flock",
  "floor",
  "flower",
  "fluid",
  "flush",
  "fly",
  "foam",
  "focus",
  "fog",
  "foil",
  "fold",
  "follow",
  "food",
  "foot",
  "force",
  "forest",
  "forget",
  "fork",
  "fortune",
  "forum",
  "forward",
  "fossil",
  "foster",
  "found",
  "fox",
  "fragile",
  "frame",
  "frequent",
  "fresh",
  "friend",
  "fringe",
  "frog",
  "front",
  "frost",
  "frown",
  "frozen",
  "fruit",
  "fuel",
  "fun",
  "funny",
  "furnace",
  "fury",
  "future",
  "gadget",
  "gain",
  "galaxy",
  "gallery",
  "game",
  "gap",
  "garage",
  "garbage",
  "garden",
  "garlic",
  "garment",
  "gas",
  "gasp",
  "gate",
  "gather",
  "gauge",
  "gaze",
  "general",
  "genius",
  "genre",
  "gentle",
  "genuine",
  "gesture",
  "ghost",
  "giant",
  "gift",
  "giggle",
  "ginger",
  "giraffe",
  "girl",
  "give",
  "glad",
  "glance",
  "glare",
  "glass",
  "glide",
  "glimpse",
  "globe",
  "gloom",
  "glory",
  "glove",
  "glow",
  "glue",
  "goat",
  "goddess",
  "gold",
  "good",
  "goose",
  "gorilla",
  "gospel",
  "gossip",
  "govern",
  "gown",
  "grab",
  "grace",
  "grain",
  "grant",
  "grape",
  "grass",
  "gravity",
  "great",
  "green",
  "grid",
  "grief",
  "grit",
  "grocery",
  "group",
  "grow",
  "grunt",
  "guard",
  "guess",
  "guide",
  "guilt",
  "guitar",
  "gun",
  "gym",
  "habit",
  "hair",
  "half",
  "hammer",
  "hamster",
  "hand",
  "happy",
  "harbor",
  "hard",
  "harsh",
  "harvest",
  "hat",
  "have",
  "hawk",
  "hazard",
  "head",
  "health",
  "heart",
  "heavy",
  "hedgehog",
  "height",
  "hello",
  "helmet",
  "help",
  "hen",
  "hero",
  "hidden",
  "high",
  "hill",
  "hint",
  "hip",
  "hire",
  "history",
  "hobby",
  "hockey",
  "hold",
  "hole",
  "holiday",
  "hollow",
  "home",
  "honey",
  "hood",
  "hope",
  "horn",
  "horror",
  "horse",
  "hospital",
  "host",
  "hotel",
  "hour",
  "hover",
  "hub",
  "huge",
  "human",
  "humble",
  "humor",
  "hundred",
  "hungry",
  "hunt",
  "hurdle",
  "hurry",
  "hurt",
  "husband",
  "hybrid",
  "ice",
  "icon",
  "idea",
  "identify",
  "idle",
  "ignore",
  "ill",
  "illegal",
  "illness",
  "image",
  "imitate",
  "immense",
  "immune",
  "impact",
  "impose",
  "improve",
  "impulse",
  "inch",
  "include",
  "income",
  "increase",
  "index",
  "indicate",
  "indoor",
  "industry",
  "infant",
  "inflict",
  "inform",
  "inhale",
  "inherit",
  "initial",
  "inject",
  "injury",
  "inmate",
  "inner",
  "innocent",
  "input",
  "inquiry",
  "insane",
  "insect",
  "inside",
  "inspire",
  "install",
  "intact",
  "interest",
  "into",
  "invest",
  "invite",
  "involve",
  "iron",
  "island",
  "isolate",
  "issue",
  "item",
  "ivory",
  "jacket",
  "jaguar",
  "jar",
  "jazz",
  "jealous",
  "jeans",
  "jelly",
  "jewel",
  "job",
  "join",
  "joke",
  "journey",
  "joy",
  "judge",
  "juice",
  "jump",
  "jungle",
  "junior",
  "junk",
  "just",
  "kangaroo",
  "keen",
  "keep",
  "ketchup",
  "key",
  "kick",
  "kid",
  "kidney",
  "kind",
  "kingdom",
  "kiss",
  "kit",
  "kitchen",
  "kite",
  "kitten",
  "kiwi",
  "knee",
  "knife",
  "knock",
  "know",
  "lab",
  "label",
  "labor",
  "ladder",
  "lady",
  "lake",
  "lamp",
  "language",
  "laptop",
  "large",
  "later",
  "latin",
  "laugh",
  "laundry",
  "lava",
  "law",
  "lawn",
  "lawsuit",
  "layer",
  "lazy",
  "leader",
  "leaf",
  "learn",
  "leave",
  "lecture",
  "left",
  "leg",
  "legal",
  "legend",
  "leisure",
  "lemon",
  "lend",
  "length",
  "lens",
  "leopard",
  "lesson",
  "letter",
  "level",
  "liar",
  "liberty",
  "library",
  "license",
  "life",
  "lift",
  "light",
  "like",
  "limb",
  "limit",
  "link",
  "lion",
  "liquid",
  "list",
  "little",
  "live",
  "lizard",
  "load",
  "loan",
  "lobster",
  "local",
  "lock",
  "logic",
  "lonely",
  "long",
  "loop",
  "lottery",
  "loud",
  "lounge",
  "love",
  "loyal",
  "lucky",
  "luggage",
  "lumber",
  "lunar",
  "lunch",
  "luxury",
  "lyrics",
  "machine",
  "mad",
  "magic",
  "magnet",
  "maid",
  "mail",
  "main",
  "major",
  "make",
  "mammal",
  "man",
  "manage",
  "mandate",
  "mango",
  "mansion",
  "manual",
  "maple",
  "marble",
  "march",
  "margin",
  "marine",
  "market",
  "marriage",
  "mask",
  "mass",
  "master",
  "match",
  "material",
  "math",
  "matrix",
  "matter",
  "maximum",
  "maze",
  "meadow",
  "mean",
  "measure",
  "meat",
  "mechanic",
  "medal",
  "media",
  "melody",
  "melt",
  "member",
  "memory",
  "mention",
  "menu",
  "mercy",
  "merge",
  "merit",
  "merry",
  "mesh",
  "message",
  "metal",
  "method",
  "middle",
  "midnight",
  "milk",
  "million",
  "mimic",
  "mind",
  "minimum",
  "minor",
  "minute",
  "miracle",
  "mirror",
  "misery",
  "miss",
  "mistake",
  "mix",
  "mixed",
  "mixture",
  "mobile",
  "model",
  "modify",
  "mom",
  "moment",
  "monitor",
  "monkey",
  "monster",
  "month",
  "moon",
  "moral",
  "more",
  "morning",
  "mosquito",
  "mother",
  "motion",
  "motor",
  "mountain",
  "mouse",
  "move",
  "movie",
  "much",
  "muffin",
  "mule",
  "multiply",
  "muscle",
  "museum",
  "mushroom",
  "music",
  "must",
  "mutual",
  "myself",
  "mystery",
  "myth",
  "naive",
  "name",
  "napkin",
  "narrow",
  "nasty",
  "nation",
  "nature",
  "near",
  "neck",
  "need",
  "negative",
  "neglect",
  "neither",
  "nephew",
  "nerve",
  "nest",
  "net",
  "network",
  "neutral",
  "never",
  "news",
  "next",
  "nice",
  "night",
  "noble",
  "noise",
  "nominee",
  "noodle",
  "normal",
  "north",
  "nose",
  "notable",
  "note",
  "nothing",
  "notice",
  "novel",
  "now",
  "nuclear",
  "number",
  "nurse",
  "nut",
  "oak",
  "obey",
  "object",
  "oblige",
  "obscure",
  "observe",
  "obtain",
  "obvious",
  "occur",
  "ocean",
  "october",
  "odor",
  "off",
  "offer",
  "office",
  "often",
  "oil",
  "okay",
  "old",
  "olive",
  "olympic",
  "omit",
  "once",
  "one",
  "onion",
  "online",
  "only",
  "open",
  "opera",
  "opinion",
  "oppose",
  "option",
  "orange",
  "orbit",
  "orchard",
  "order",
  "ordinary",
  "organ",
  "orient",
  "original",
  "orphan",
  "ostrich",
  "other",
  "outdoor",
  "outer",
  "output",
  "outside",
  "oval",
  "oven",
  "over",
  "own",
  "owner",
  "oxygen",
  "oyster",
  "ozone",
  "pact",
  "paddle",
  "page",
  "pair",
  "palace",
  "palm",
  "panda",
  "panel",
  "panic",
  "panther",
  "paper",
  "parade",
  "parent",
  "park",
  "parrot",
  "party",
  "pass",
  "patch",
  "path",
  "patient",
  "patrol",
  "pattern",
  "pause",
  "pave",
  "payment",
  "peace",
  "peanut",
  "pear",
  "peasant",
  "pelican",
  "pen",
  "penalty",
  "pencil",
  "people",
  "pepper",
  "perfect",
  "permit",
  "person",
  "pet",
  "phone",
  "photo",
  "phrase",
  "physical",
  "piano",
  "picnic",
  "picture",
  "piece",
  "pig",
  "pigeon",
  "pill",
  "pilot",
  "pink",
  "pioneer",
  "pipe",
  "pistol",
  "pitch",
  "pizza",
  "place",
  "planet",
  "plastic",
  "plate",
  "play",
  "please",
  "pledge",
  "pluck",
  "plug",
  "plunge",
  "poem",
  "poet",
  "point",
  "polar",
  "pole",
  "police",
  "pond",
  "pony",
  "pool",
  "popular",
  "portion",
  "position",
  "possible",
  "post",
  "potato",
  "pottery",
  "poverty",
  "powder",
  "power",
  "practice",
  "praise",
  "predict",
  "prefer",
  "prepare",
  "present",
  "pretty",
  "prevent",
  "price",
  "pride",
  "primary",
  "print",
  "priority",
  "prison",
  "private",
  "prize",
  "problem",
  "process",
  "produce",
  "profit",
  "program",
  "project",
  "promote",
  "proof",
  "property",
  "prosper",
  "protect",
  "proud",
  "provide",
  "public",
  "pudding",
  "pull",
  "pulp",
  "pulse",
  "pumpkin",
  "punch",
  "pupil",
  "puppy",
  "purchase",
  "purity",
  "purpose",
  "purse",
  "push",
  "put",
  "puzzle",
  "pyramid",
  "quality",
  "quantum",
  "quarter",
  "question",
  "quick",
  "quit",
  "quiz",
  "quote",
  "rabbit",
  "raccoon",
  "race",
  "rack",
  "radar",
  "radio",
  "rail",
  "rain",
  "raise",
  "rally",
  "ramp",
  "ranch",
  "random",
  "range",
  "rapid",
  "rare",
  "rate",
  "rather",
  "raven",
  "raw",
  "razor",
  "ready",
  "real",
  "reason",
  "rebel",
  "rebuild",
  "recall",
  "receive",
  "recipe",
  "record",
  "recycle",
  "reduce",
  "reflect",
  "reform",
  "refuse",
  "region",
  "regret",
  "regular",
  "reject",
  "relax",
  "release",
  "relief",
  "rely",
  "remain",
  "remember",
  "remind",
  "remove",
  "render",
  "renew",
  "rent",
  "reopen",
  "repair",
  "repeat",
  "replace",
  "report",
  "require",
  "rescue",
  "resemble",
  "resist",
  "resource",
  "response",
  "result",
  "retire",
  "retreat",
  "return",
  "reunion",
  "reveal",
  "review",
  "reward",
  "rhythm",
  "rib",
  "ribbon",
  "rice",
  "rich",
  "ride",
  "ridge",
  "rifle",
  "right",
  "rigid",
  "ring",
  "riot",
  "ripple",
  "risk",
  "ritual",
  "rival",
  "river",
  "road",
  "roast",
  "robot",
  "robust",
  "rocket",
  "romance",
  "roof",
  "rookie",
  "room",
  "rose",
  "rotate",
  "rough",
  "round",
  "route",
  "royal",
  "rubber",
  "rude",
  "rug",
  "rule",
  "run",
  "runway",
  "rural",
  "sad",
  "saddle",
  "sadness",
  "safe",
  "sail",
  "salad",
  "salmon",
  "salon",
  "salt",
  "salute",
  "same",
  "sample",
  "sand",
  "satisfy",
  "satoshi",
  "sauce",
  "sausage",
  "save",
  "say",
  "scale",
  "scan",
  "scare",
  "scatter",
  "scene",
  "scheme",
  "school",
  "science",
  "scissors",
  "scorpion",
  "scout",
  "scrap",
  "screen",
  "script",
  "scrub",
  "sea",
  "search",
  "season",
  "seat",
  "second",
  "secret",
  "section",
  "security",
  "seed",
  "seek",
  "segment",
  "select",
  "sell",
  "seminar",
  "senior",
  "sense",
  "sentence",
  "series",
  "service",
  "session",
  "settle",
  "setup",
  "seven",
  "shadow",
  "shaft",
  "shallow",
  "share",
  "shed",
  "shell",
  "sheriff",
  "shield",
  "shift",
  "shine",
  "ship",
  "shiver",
  "shock",
  "shoe",
  "shoot",
  "shop",
  "short",
  "shoulder",
  "shove",
  "shrimp",
  "shrug",
  "shuffle",
  "shy",
  "sibling",
  "sick",
  "side",
  "siege",
  "sight",
  "sign",
  "silent",
  "silk",
  "silly",
  "silver",
  "similar",
  "simple",
  "since",
  "sing",
  "siren",
  "sister",
  "situate",
  "six",
  "size",
  "skate",
  "sketch",
  "ski",
  "skill",
  "skin",
  "skirt",
  "skull",
  "slab",
  "slam",
  "sleep",
  "slender",
  "slice",
  "slide",
  "slight",
  "slim",
  "slogan",
  "slot",
  "slow",
  "slush",
  "small",
  "smart",
  "smile",
  "smoke",
  "smooth",
  "snack",
  "snake",
  "snap",
  "sniff",
  "snow",
  "soap",
  "soccer",
  "social",
  "sock",
  "soda",
  "soft",
  "solar",
  "soldier",
  "solid",
  "solution",
  "solve",
  "someone",
  "song",
  "soon",
  "sorry",
  "sort",
  "soul",
  "sound",
  "soup",
  "source",
  "south",
  "space",
  "spare",
  "spatial",
  "spawn",
  "speak",
  "special",
  "speed",
  "spell",
  "spend",
  "sphere",
  "spice",
  "spider",
  "spike",
  "spin",
  "spirit",
  "split",
  "spoil",
  "sponsor",
  "spoon",
  "sport",
  "spot",
  "spray",
  "spread",
  "spring",
  "spy",
  "square",
  "squeeze",
  "squirrel",
  "stable",
  "stadium",
  "staff",
  "stage",
  "stairs",
  "stamp",
  "stand",
  "start",
  "state",
  "stay",
  "steak",
  "steel",
  "stem",
  "step",
  "stereo",
  "stick",
  "still",
  "sting",
  "stock",
  "stomach",
  "stone",
  "stool",
  "story",
  "stove",
  "strategy",
  "street",
  "strike",
  "strong",
  "struggle",
  "student",
  "stuff",
  "stumble",
  "style",
  "subject",
  "submit",
  "subway",
  "success",
  "such",
  "sudden",
  "suffer",
  "sugar",
  "suggest",
  "suit",
  "summer",
  "sun",
  "sunny",
  "sunset",
  "super",
  "supply",
  "supreme",
  "sure",
  "surface",
  "surge",
  "surprise",
  "surround",
  "survey",
  "suspect",
  "sustain",
  "swallow",
  "swamp",
  "swap",
  "swarm",
  "swear",
  "sweet",
  "swift",
  "swim",
  "swing",
  "switch",
  "sword",
  "symbol",
  "symptom",
  "syrup",
  "system",
  "table",
  "tackle",
  "tag",
  "tail",
  "talent",
  "talk",
  "tank",
  "tape",
  "target",
  "task",
  "taste",
  "tattoo",
  "taxi",
  "teach",
  "team",
  "tell",
  "ten",
  "tenant",
  "tennis",
  "tent",
  "term",
  "test",
  "text",
  "thank",
  "that",
  "theme",
  "then",
  "theory",
  "there",
  "they",
  "thing",
  "this",
  "thought",
  "three",
  "thrive",
  "throw",
  "thumb",
  "thunder",
  "ticket",
  "tide",
  "tiger",
  "tilt",
  "timber",
  "time",
  "tiny",
  "tip",
  "tired",
  "tissue",
  "title",
  "toast",
  "tobacco",
  "today",
  "toddler",
  "toe",
  "together",
  "toilet",
  "token",
  "tomato",
  "tomorrow",
  "tone",
  "tongue",
  "tonight",
  "tool",
  "tooth",
  "top",
  "topic",
  "topple",
  "torch",
  "tornado",
  "tortoise",
  "toss",
  "total",
  "tourist",
  "toward",
  "tower",
  "town",
  "toy",
  "track",
  "trade",
  "traffic",
  "tragic",
  "train",
  "transfer",
  "trap",
  "trash",
  "travel",
  "tray",
  "treat",
  "tree",
  "trend",
  "trial",
  "tribe",
  "trick",
  "trigger",
  "trim",
  "trip",
  "trophy",
  "trouble",
  "truck",
  "true",
  "truly",
  "trumpet",
  "trust",
  "truth",
  "try",
  "tube",
  "tuition",
  "tumble",
  "tuna",
  "tunnel",
  "turkey",
  "turn",
  "turtle",
  "twelve",
  "twenty",
  "twice",
  "twin",
  "twist",
  "two",
  "type",
  "typical",
  "ugly",
  "umbrella",
  "unable",
  "unaware",
  "uncle",
  "uncover",
  "under",
  "undo",
  "unfair",
  "unfold",
  "unhappy",
  "uniform",
  "unique",
  "unit",
  "universe",
  "unknown",
  "unlock",
  "until",
  "unusual",
  "unveil",
  "update",
  "upgrade",
  "uphold",
  "upon",
  "upper",
  "upset",
  "urban",
  "urge",
  "usage",
  "use",
  "used",
  "useful",
  "useless",
  "usual",
  "utility",
  "vacant",
  "vacuum",
  "vague",
  "valid",
  "valley",
  "valve",
  "van",
  "vanish",
  "vapor",
  "various",
  "vast",
  "vault",
  "vehicle",
  "velvet",
  "vendor",
  "venture",
  "venue",
  "verb",
  "verify",
  "version",
  "very",
  "vessel",
  "veteran",
  "viable",
  "vibrant",
  "vicious",
  "victory",
  "video",
  "view",
  "village",
  "vintage",
  "violin",
  "virtual",
  "virus",
  "visa",
  "visit",
  "visual",
  "vital",
  "vivid",
  "vocal",
  "voice",
  "void",
  "volcano",
  "volume",
  "vote",
  "voyage",
  "wage",
  "wagon",
  "wait",
  "walk",
  "wall",
  "walnut",
  "want",
  "warfare",
  "warm",
  "warrior",
  "wash",
  "wasp",
  "waste",
  "water",
  "wave",
  "way",
  "wealth",
  "weapon",
  "wear",
  "weasel",
  "weather",
  "web",
  "wedding",
  "weekend",
  "weird",
  "welcome",
  "west",
  "wet",
  "whale",
  "what",
  "wheat",
  "wheel",
  "when",
  "where",
  "whip",
  "whisper",
  "wide",
  "width",
  "wife",
  "wild",
  "will",
  "win",
  "window",
  "wine",
  "wing",
  "wink",
  "winner",
  "winter",
  "wire",
  "wisdom",
  "wise",
  "wish",
  "witness",
  "wolf",
  "woman",
  "wonder",
  "wood",
  "wool",
  "word",
  "work",
  "world",
  "worry",
  "worth",
  "wrap",
  "wreck",
  "wrestle",
  "wrist",
  "write",
  "wrong",
  "yard",
  "year",
  "yellow",
  "you",
  "young",
  "youth",
  "zebra",
  "zero",
  "zone",
  "zoo"
]);
var MNEMONIC_LENGTHS = /* @__PURE__ */ new Set([12, 15, 18, 21, 24]);
function isMnemonic(value) {
  const words = value.trim().toLowerCase().split(/\s+/);
  if (!MNEMONIC_LENGTHS.has(words.length))
    return false;
  return words.every((w) => BIP39_WORDS.has(w));
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/extra.js
var pre = (n) => (v) => v.length <= n ? "***" : v.slice(0, n) + "***";
var EXTRA_DETECTORS = [
  // ── third-party service secrets (distinctive → on by default) ──────────────
  {
    id: "digitalocean_token",
    label: "DigitalOcean token",
    why: "Controls DigitalOcean infrastructure and billing.",
    pattern: /\bdop_v1_[a-f0-9]{64}\b/g,
    mask: pre(7),
    default: true,
    tags: ["secret"]
  },
  {
    id: "sentry_dsn",
    label: "Sentry DSN",
    why: "A Sentry DSN can be used to send events to your project.",
    pattern: /\bhttps:\/\/[0-9a-zA-Z]{16,}@[\w.-]*sentry\.io\/\d+\b/g,
    mask: () => "[REDACTED SENTRY DSN]",
    default: true,
    tags: ["secret"]
  },
  {
    id: "new_relic_key",
    label: "New Relic key",
    why: "Grants access to your New Relic account data.",
    pattern: /\b(?:NRAK-[A-Z0-9]{27}|NRJS-[a-f0-9]{19})\b/g,
    mask: pre(5),
    default: true,
    tags: ["secret"]
  },
  {
    id: "discord_bot_token",
    label: "Discord bot token",
    why: "Full control of a Discord bot account.",
    pattern: /\b[MNO][A-Za-z\d_-]{23}\.[A-Za-z\d_-]{6}\.[A-Za-z\d_-]{27,}\b/g,
    mask: () => "[REDACTED DISCORD TOKEN]",
    default: true,
    tags: ["secret"]
  },
  {
    id: "telegram_bot_token",
    label: "Telegram bot token",
    why: "Full control of a Telegram bot.",
    pattern: /\b\d{8,10}:[A-Za-z0-9_-]{34,46}\b/g,
    mask: () => "[REDACTED TELEGRAM TOKEN]",
    default: true,
    tags: ["secret"]
  },
  {
    id: "shopify_token",
    label: "Shopify token",
    why: "Access to a Shopify store and its data.",
    pattern: /\bshp(?:at|ca|pa|ss)_[a-fA-F0-9]{32}\b/g,
    mask: pre(6),
    default: true,
    tags: ["secret"]
  },
  {
    id: "square_token",
    label: "Square token",
    why: "Can move money through a Square account.",
    pattern: /\b(?:sq0[a-z]{3}-[A-Za-z0-9_-]{22,43}|EAAA[A-Za-z0-9_-]{60})\b/g,
    mask: pre(6),
    default: true,
    tags: ["secret"]
  },
  {
    id: "azure_storage_key",
    label: "Azure storage key",
    why: "A storage account key grants full access to the account.",
    pattern: /\bAccountKey=[A-Za-z0-9+/]{86}==/g,
    mask: () => "AccountKey=***",
    default: true,
    tags: ["secret"]
  },
  {
    id: "discord_webhook",
    label: "Discord webhook URL",
    why: "Anyone with the URL can post messages to the channel.",
    pattern: /\bhttps:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,}/g,
    mask: () => "[REDACTED DISCORD WEBHOOK]",
    default: true,
    tags: ["secret"]
  },
  {
    id: "huggingface_token",
    label: "Hugging Face token",
    why: "Grants access to private models, datasets, and inference.",
    pattern: /\bhf_[A-Za-z0-9]{30,45}\b/g,
    mask: pre(3),
    default: true,
    tags: ["secret"]
  },
  {
    id: "vault_token",
    label: "HashiCorp Vault token",
    why: "A Vault token unlocks every secret it is entitled to read.",
    pattern: /\bhv[sbr]\.[A-Za-z0-9_-]{20,200}(?![A-Za-z0-9_-])/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "groq_key",
    label: "Groq API key",
    why: "Bills inference against your Groq account.",
    pattern: /\bgsk_[A-Za-z0-9]{40,60}\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "xai_key",
    label: "xAI API key",
    why: "Bills inference against your xAI account.",
    pattern: /\bxai-[A-Za-z0-9]{40,120}\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "perplexity_key",
    label: "Perplexity API key",
    why: "Bills inference against your Perplexity account.",
    pattern: /\bpplx-[A-Za-z0-9]{40,60}\b/g,
    mask: pre(5),
    default: true,
    tags: ["secret"]
  },
  {
    id: "openrouter_key",
    label: "OpenRouter API key",
    why: "Bills requests to every model behind your OpenRouter account.",
    pattern: /\bsk-or-v1-[a-f0-9]{64}\b/g,
    mask: pre(9),
    default: true,
    tags: ["secret"]
  },
  {
    id: "replicate_token",
    label: "Replicate token",
    why: "Runs and bills model predictions on your account.",
    pattern: /\br8_[A-Za-z0-9]{30,45}\b/g,
    mask: pre(3),
    default: true,
    tags: ["secret"]
  },
  {
    id: "databricks_token",
    label: "Databricks token",
    why: "Access to workspaces, jobs, and data in Databricks.",
    pattern: /\bdapi[a-f0-9]{32}(?:-\d)?\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "airtable_pat",
    label: "Airtable personal access token",
    why: "Reads and writes the bases the token is scoped to.",
    pattern: /\bpat[A-Za-z0-9]{14}\.[a-f0-9]{64}\b/g,
    mask: pre(6),
    default: true,
    tags: ["secret"]
  },
  {
    id: "postman_key",
    label: "Postman API key",
    why: "Access to workspaces, collections, and stored environments.",
    pattern: /\bPMAK-[a-f0-9]{24}-[a-f0-9]{34}\b/g,
    mask: pre(5),
    default: true,
    tags: ["secret"]
  },
  {
    id: "linear_key",
    label: "Linear API key",
    why: "Reads and writes issues and projects in your workspace.",
    pattern: /\blin_api_[A-Za-z0-9]{40,48}\b/g,
    mask: pre(8),
    default: true,
    tags: ["secret"]
  },
  {
    id: "figma_token",
    label: "Figma token",
    why: "Access to design files and team resources.",
    pattern: /\bfigd_[A-Za-z0-9_-]{40,50}(?![A-Za-z0-9_-])/g,
    mask: pre(5),
    default: true,
    tags: ["secret"]
  },
  {
    id: "notion_token",
    label: "Notion token",
    why: "Reads and writes every page the integration can reach.",
    pattern: /\b(?:ntn_[A-Za-z0-9]{40,50}|secret_[A-Za-z0-9]{43})\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "doppler_token",
    label: "Doppler token",
    why: "Reads the secrets of the configs it is scoped to.",
    pattern: /\bdp\.(?:ct|pt|st)\.(?:[a-z0-9_-]{2,35}\.)?[A-Za-z0-9]{40,44}\b/g,
    mask: pre(6),
    default: true,
    tags: ["secret"]
  },
  {
    id: "supabase_key",
    label: "Supabase key",
    why: "Access to your Supabase project and its database.",
    pattern: /\bsbp_[a-f0-9]{40}\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "netlify_token",
    label: "Netlify token",
    why: "Deploys and manages sites on your Netlify account.",
    pattern: /\bnfp_[A-Za-z0-9]{36,60}\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  {
    id: "stripe_webhook_secret",
    label: "Stripe webhook secret",
    why: "Lets an attacker forge signed Stripe webhook events.",
    pattern: /\bwhsec_[A-Za-z0-9]{32,64}\b/g,
    mask: pre(6),
    default: true,
    tags: ["secret"]
  },
  {
    id: "gcp_service_account",
    label: "GCP service account key",
    why: "A service-account key file authenticates as the service account.",
    pattern: /"private_key_id"\s*:\s*"([a-f0-9]{40})"/g,
    capture: 1,
    mask: () => "***",
    default: true,
    tags: ["secret"],
    prefilter: ["private_key_id"]
  },
  {
    id: "gcp_refresh_token",
    label: "GCP OAuth refresh token",
    why: "Mints fresh Google Cloud access tokens indefinitely.",
    pattern: /\b1\/\/[A-Za-z0-9_-]{20,160}(?![A-Za-z0-9_-])/g,
    mask: pre(4),
    default: true,
    tags: ["secret"],
    prefilter: ["1//"]
  },
  {
    id: "mailgun_key",
    label: "Mailgun API key",
    why: "Can send mail as your domain and read stored messages.",
    pattern: /\bkey-[a-f0-9]{32}\b/g,
    mask: pre(4),
    default: true,
    tags: ["secret"]
  },
  // ── crypto (opt-in) ────────────────────────────────────────────────────────
  {
    id: "eth_address",
    label: "Ethereum address",
    why: "A wallet address \u2014 can identify a person and their holdings.",
    pattern: /\b0x[a-fA-F0-9]{40}\b/g,
    mask: pre(6),
    default: false,
    tags: ["crypto"]
  },
  {
    id: "btc_address",
    label: "Bitcoin address",
    why: "A wallet address \u2014 can identify a person and their holdings.",
    pattern: /\b(?:bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g,
    mask: pre(4),
    default: false,
    tags: ["crypto"]
  },
  {
    id: "seed_phrase",
    label: "Crypto seed phrase",
    why: "A BIP39 mnemonic recovers an entire wallet \u2014 the highest-value secret there is.",
    pattern: /\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/g,
    validate: isMnemonic,
    mask: () => "[REDACTED SEED PHRASE]",
    default: false,
    tags: ["crypto"]
  },
  // ── finance (opt-in, checksum-validated where possible) ─────────────────────
  {
    id: "aba_routing",
    label: "US bank routing number",
    why: "An ABA routing number identifies a US bank account.",
    pattern: /\b\d{9}\b/g,
    validate: abaValid,
    mask: () => "[REDACTED ROUTING]",
    default: false,
    tags: ["finance", "us"]
  },
  {
    id: "swift_bic",
    label: "SWIFT / BIC code",
    why: "Identifies a bank for international transfers.",
    pattern: /\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    mask: pre(4),
    default: false,
    tags: ["finance"]
  },
  // ── identity (opt-in, checksum-validated) ───────────────────────────────────
  {
    id: "uk_nhs",
    label: "UK NHS number",
    why: "A UK National Health Service number \u2014 health PII.",
    pattern: /\b\d{3}[ -]?\d{3}[ -]?\d{4}\b/g,
    validate: nhsValid,
    mask: () => "[REDACTED ID]",
    default: false,
    tags: ["pii", "id", "gb"]
  },
  {
    id: "vin",
    label: "Vehicle VIN",
    why: "A vehicle identification number can identify an owner.",
    pattern: /\b[A-HJ-NPR-Z0-9]{17}\b/g,
    validate: vinValid,
    mask: () => "[REDACTED VIN]",
    default: false,
    tags: ["vehicle"]
  },
  // ── network (opt-in) ────────────────────────────────────────────────────────
  {
    id: "coordinates",
    label: "Geographic coordinates",
    why: "Precise lat/long can reveal a person\u2019s location.",
    pattern: /\b-?\d{1,3}\.\d{4,},\s?-?\d{1,3}\.\d{4,}\b/g,
    mask: () => "[REDACTED COORDS]",
    default: false,
    tags: ["network"]
  },
  {
    id: "internal_url",
    label: "Internal URL",
    why: "Localhost and private-range URLs expose internal infrastructure.",
    pattern: /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.[\d.]+)(?::\d+)?[^\s]*/g,
    mask: () => "[REDACTED INTERNAL URL]",
    default: false,
    tags: ["network"]
  }
];

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/detectors.js
function keepPrefix(n) {
  return (v) => v.length <= n ? "***" : v.slice(0, n) + "***";
}
function keepLast(n) {
  return (v) => {
    const digits = v.replace(/\D/g, "");
    const tail = digits.slice(-n);
    const groups = Math.max(0, Math.ceil((digits.length - n) / 4));
    return ("**** ".repeat(groups) + tail).trim();
  };
}
function luhn(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19)
    return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9)
        d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function entropy(s) {
  const freq = /* @__PURE__ */ new Map();
  for (const ch of s)
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let e = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    e -= p * Math.log2(p);
  }
  return e;
}
function phoneValid(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15)
    return false;
  if (!value.startsWith("+")) {
    if (digits.length < 9)
      return false;
    if (/(?:19|20)\d{2}$/.test(digits) && /[.\s-](?:19|20)\d{2}$/.test(value))
      return false;
  }
  return true;
}
var SENSITIVE_KEY_RE = /^(?:pass(?:word|wd)?|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|auth(?:orization)?|cookie|session[_-]?id|refresh[_-]?token|credit[_-]?card|card[_-]?number|cvv|ssn)$/i;
var SENSITIVE_KEY_DETECTOR = {
  id: "sensitive_key",
  label: "Sensitive field",
  why: "A value stored under a field name that is sensitive by convention.",
  pattern: /(?!)/,
  mask: () => "***",
  default: true
};
var DETECTORS = [
  {
    id: "private_key",
    label: "Private key",
    why: "A PEM private key is a full cryptographic identity \u2014 whoever holds it is you.",
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
    mask: () => "[REDACTED PRIVATE KEY]",
    default: true
  },
  {
    id: "aws_access_key",
    label: "AWS access key ID",
    why: "Pairs with a secret key to control cloud resources and billing.",
    pattern: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA)(?:[ \t-]?[A-Z0-9]){16}\b/g,
    validate: (value) => /^(?:AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA)[A-Z0-9]{16}$/.test(value.replace(/[ \t-]/g, "")),
    mask: keepPrefix(4),
    default: true
  },
  {
    id: "aws_secret_key",
    label: "AWS secret access key",
    why: "The signing half of an AWS credential pair \u2014 full API access.",
    pattern: /(?:aws)?_?secret_?(?:access_?)?key["'\s]*[:=]\s*["']?([A-Za-z0-9/+]{40})(?![A-Za-z0-9/+=])/gi,
    capture: 1,
    mask: () => "***",
    default: true,
    priority: 1,
    prefilter: ["secret"]
  },
  {
    id: "github_token",
    label: "GitHub token",
    why: "Grants access to repositories and account actions.",
    pattern: /\b(?:gh[posur]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/g,
    mask: keepPrefix(4),
    default: true
  },
  {
    id: "gitlab_token",
    label: "GitLab token",
    why: "A GitLab personal access token grants API and repo access.",
    pattern: /\bglpat-[A-Za-z0-9_-]{20}\b/g,
    mask: keepPrefix(6),
    default: true
  },
  {
    id: "slack_token",
    label: "Slack token",
    why: "Lets the holder read and post as your workspace app.",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,64}\b/g,
    mask: keepPrefix(5),
    default: true
  },
  {
    id: "stripe_key",
    label: "Stripe secret key",
    why: "A live secret or restricted key can move real money.",
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,64}\b/g,
    mask: (v) => v.slice(0, v.indexOf("_", v.indexOf("_") + 1) + 1) + "***",
    default: true
  },
  {
    id: "anthropic_key",
    label: "Anthropic API key",
    why: "Bills against your Anthropic account and reaches your models and data.",
    pattern: /\bsk-ant-[A-Za-z0-9_-]{24,160}\b/g,
    mask: keepPrefix(7),
    default: true
  },
  {
    id: "openai_key",
    label: "OpenAI API key",
    why: "Bills against your account and reaches your models and data.",
    pattern: /\bsk-(?!ant-|or-)(?:proj-)?[A-Za-z0-9_-]{20,64}\b/g,
    mask: keepPrefix(3),
    default: true
  },
  {
    id: "google_api_key",
    label: "Google API key",
    why: "Grants access to enabled Google Cloud APIs on your project.",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    mask: keepPrefix(4),
    default: true
  },
  {
    id: "sendgrid_key",
    label: "SendGrid API key",
    why: "Can send mail as your domain and read templates.",
    pattern: /\bSG\.[A-Za-z0-9_-]{16,32}\.[A-Za-z0-9_-]{16,64}\b/g,
    mask: keepPrefix(3),
    default: true
  },
  {
    id: "twilio_key",
    label: "Twilio SID / key",
    why: "Can send messages and place calls billed to your account.",
    pattern: /\b(?:AC|SK)[a-f0-9]{32}\b/g,
    mask: keepPrefix(4),
    default: true
  },
  {
    id: "npm_token",
    label: "npm token",
    why: "Can publish packages to your npm account.",
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
    mask: keepPrefix(4),
    default: true
  },
  {
    id: "jwt",
    label: "JSON Web Token",
    why: "Often a live session or bearer credential \u2014 decode it and you may be signed in.",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\b/g,
    mask: () => "[REDACTED JWT]",
    default: true
  },
  {
    id: "bearer_token",
    label: "Bearer token",
    why: "A bearer token in an Authorization header is a live credential.",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{8,}={0,2}/g,
    mask: () => "Bearer ***",
    default: true
  },
  {
    id: "basic_auth",
    label: "Basic auth header",
    why: "Base64 in a Basic header decodes straight back to user:password.",
    pattern: /\bBasic\s+[A-Za-z0-9+/]{8,}={0,2}/g,
    mask: () => "Basic ***",
    default: true
  },
  {
    id: "url_credentials",
    label: "Credentials in URL",
    why: "A username:password baked into a connection string leaks the password.",
    pattern: /\b[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:@\s/]+:[^@\s/]+@/g,
    mask: (m) => m.replace(/:([^:@\s/]+)@$/, ":***@"),
    default: true
  },
  {
    id: "generic_assignment",
    label: "Assigned secret",
    why: "A value assigned to a sensitive-looking field name (password=\u2026, \u5BC6\u7801: \u2026) in any language.",
    pattern: assignmentPattern(),
    mask: (m) => m.replace(/([:=]\s*["']?)([^\s"',;]{4,})(["']?)\s*$/u, "$1***$3"),
    default: true,
    tags: ["secret"]
  },
  {
    id: "email",
    label: "Email address",
    why: "Personal data that usually does not belong in logs.",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}\b/g,
    mask: (m) => (m[0] ?? "") + "***@***",
    default: true,
    tags: ["pii"],
    prefilter: ["@"]
  },
  {
    id: "obfuscated_email",
    label: "Obfuscated email address",
    why: "An email written with explicit \u201Cat\u201D and \u201Cdot\u201D separators to evade ordinary filters.",
    pattern: /\b[A-Za-z0-9._%+-]{1,64}\s*(?:\[at\]|\(at\))\s*[A-Za-z0-9-]{1,63}(?:\s*(?:\[dot\]|\(dot\))\s*[A-Za-z0-9-]{1,63}){1,4}\b/gi,
    mask: (m) => (m[0] ?? "") + "*** [at] *** [dot] ***",
    default: true,
    tags: ["pii", "email", "obfuscated"],
    risk: "high",
    confidence: 0.84,
    priority: 45,
    prefilter: ["[at]", "(at)"]
  },
  {
    id: "credit_card",
    label: "Payment card number",
    why: "A card number in logs is a PCI-DSS violation.",
    pattern: /\b\d(?:[ -]?\d){12,18}\b/g,
    validate: luhn,
    mask: keepLast(4),
    default: true,
    tags: ["pii", "finance"]
  },
  {
    id: "phone",
    label: "Phone number",
    why: "A phone number is personal data.",
    // Three shapes: E.164 with optional formatting (+90 532 123 45 67),
    // a parenthesized area code ((555) 123-4567), or a trunk-0 national number
    // with separator groups (0532 123 45 67). Bare digit runs never match —
    // they need a +, parens, or a leading trunk 0 plus separators.
    pattern: /(?:\+[1-9]\d{0,2}[\s.-]?(?:\(\d{1,4}\)[\s.-]?)?\d{1,4}(?:[\s.-]?\d{2,4}){1,4}|\(\d{2,4}\)[\s.-]?\d{2,4}(?:[\s.-]\d{2,4}){1,3}|\b0\d{1,4}(?:[\s.-]\d{2,4}){2,4})(?!\d)/g,
    validate: phoneValid,
    mask: (m) => (m.startsWith("+") ? m.slice(0, 3) : m.slice(0, 2)) + "***",
    default: false,
    tags: ["pii"],
    confidence: 0.8,
    context: {
      positive: /\b(?:phone|tel|mobile|cell|call|fax|whatsapp|viber|telefon|номер|téléphone|handy)\b/i,
      negative: /\b(?:date|version|invoice|order|ref)\b/i
    }
  },
  {
    id: "ipv4",
    label: "IPv4 address",
    why: "Can be personal data or reveal internal infrastructure.",
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
    mask: () => "***.***.***.***",
    default: false,
    tags: ["network"]
  },
  {
    id: "ipv6",
    label: "IPv6 address",
    why: "Can be personal data or reveal internal infrastructure.",
    pattern: /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g,
    mask: () => "[REDACTED IPv6]",
    default: false,
    tags: ["network"]
  },
  {
    id: "mac_address",
    label: "MAC address",
    why: "A hardware address that can identify a device.",
    pattern: /\b(?:[A-Fa-f0-9]{2}:){5}[A-Fa-f0-9]{2}\b/g,
    mask: () => "**:**:**:**:**:**",
    default: false,
    tags: ["network"]
  },
  {
    id: "high_entropy",
    label: "High-entropy string",
    why: "A long random-looking token \u2014 likely a key even if its format is unknown.",
    pattern: /\b[A-Za-z0-9+/=_-]{20,80}\b/g,
    validate: (v) => entropy(v) >= 3.5,
    mask: keepPrefix(4),
    default: false,
    tags: ["secret"],
    refine: true
  },
  {
    id: "person_name",
    label: "Person name",
    why: "A person name appearing after an explicit identity label.",
    pattern: /(?:full[ _-]?name|customer[ _-]?name|contact[ _-]?name|name|ad[ıi]|isim|nombre|nom|nome|姓名|الاسم)\s*(?:[:=]|\bis\b)\s*["']?([\p{L}][\p{L}'’.-]{1,39}(?:\s+[\p{L}][\p{L}'’.-]{1,39}){1,3})/giu,
    capture: 1,
    mask: () => "[REDACTED PERSON]",
    default: false,
    tags: ["pii", "contextual"],
    risk: "high",
    confidence: 0.86,
    priority: 60
  },
  {
    id: "street_address",
    label: "Street address",
    why: "A street address appearing after an explicit address label.",
    pattern: /(?:street[ _-]?address|postal[ _-]?address|shipping[ _-]?address|address|ünvan|adres|dirección|adresse|indirizzo|地址|العنوان)\s*[:=]\s*["']?(\d{1,6}\s+[\p{L}0-9.'’ -]{2,60}\s+(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|way|küçəsi|küçe|sokak|cadde))/giu,
    capture: 1,
    mask: () => "[REDACTED ADDRESS]",
    default: false,
    tags: ["pii", "contextual"],
    risk: "high",
    confidence: 0.9,
    priority: 65
  },
  {
    id: "date_of_birth",
    label: "Date of birth",
    why: "A birth date is a strong quasi-identifier when linked to a person.",
    pattern: /(?:date[ _-]?of[ _-]?birth|birth[ _-]?date|dob|doğum[ _-]?tarixi|fecha[ _-]?de[ _-]?nacimiento|date[ _-]?de[ _-]?naissance|出生日期)\s*[:=]\s*["']?((?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:[12]\d|3[01]|0?[1-9])|(?:[12]\d|3[01]|0?[1-9])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2})/giu,
    capture: 1,
    mask: () => "[REDACTED DOB]",
    default: false,
    tags: ["pii", "contextual"],
    risk: "high",
    confidence: 0.96,
    priority: 70
  },
  ...LOCALE_DETECTORS,
  ...EXTRA_DETECTORS
];

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/crypto.js
var SHA256_K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var encoder = new TextEncoder();
function rotr(value, bits) {
  return value >>> bits | value << 32 - bits;
}
function sha256Bytes(input) {
  const data = typeof input === "string" ? encoder.encode(input) : input;
  const bitLength = data.length * 8;
  const paddedLength = Math.ceil((data.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[data.length] = 128;
  const view = new DataView(padded.buffer);
  const high = Math.floor(bitLength / 4294967296);
  const low = bitLength >>> 0;
  view.setUint32(paddedLength - 8, high, false);
  view.setUint32(paddedLength - 4, low, false);
  const state = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++)
      words[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const w15 = words[i - 15];
      const w2 = words[i - 2];
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ w15 >>> 3;
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ w2 >>> 10;
      words[i] = words[i - 16] + s0 + words[i - 7] + s1 >>> 0;
    }
    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let h = state[7];
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const choice = e & f ^ ~e & g;
      const t1 = h + s1 + choice + SHA256_K[i] + words[i] >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = a & b ^ a & c ^ b & c;
      const t2 = s0 + majority >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 >>> 0;
    }
    state[0] = state[0] + a >>> 0;
    state[1] = state[1] + b >>> 0;
    state[2] = state[2] + c >>> 0;
    state[3] = state[3] + d >>> 0;
    state[4] = state[4] + e >>> 0;
    state[5] = state[5] + f >>> 0;
    state[6] = state[6] + g >>> 0;
    state[7] = state[7] + h >>> 0;
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < state.length; i++)
    outView.setUint32(i * 4, state[i], false);
  return out;
}
function hmacSha256Bytes(key, message) {
  let keyBytes = typeof key === "string" ? encoder.encode(key) : key;
  const messageBytes = typeof message === "string" ? encoder.encode(message) : message;
  if (keyBytes.length > 64)
    keyBytes = sha256Bytes(keyBytes);
  const block = new Uint8Array(64);
  block.set(keyBytes);
  const innerPad = new Uint8Array(64);
  const outerPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    innerPad[i] = block[i] ^ 54;
    outerPad[i] = block[i] ^ 92;
  }
  const inner = new Uint8Array(innerPad.length + messageBytes.length);
  inner.set(innerPad);
  inner.set(messageBytes, innerPad.length);
  const innerHash = sha256Bytes(inner);
  const outer = new Uint8Array(outerPad.length + innerHash.length);
  outer.set(outerPad);
  outer.set(innerHash, outerPad.length);
  return sha256Bytes(outer);
}
function bytesToHex(bytes) {
  let out = "";
  for (const byte of bytes)
    out += byte.toString(16).padStart(2, "0");
  return out;
}
function hmacFingerprint(key, value, bytes = 16) {
  if (!key)
    throw new Error("A non-empty transformSecret is required for deterministic protected transforms.");
  return bytesToHex(hmacSha256Bytes(key, value).subarray(0, bytes));
}
function deriveBytes(key, context, length) {
  if (!key)
    throw new Error("A non-empty transformSecret is required for deterministic protected transforms.");
  const out = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  while (offset < length) {
    const block = hmacSha256Bytes(key, `${context}\0${counter++}`);
    const take = Math.min(block.length, length - offset);
    out.set(block.subarray(0, take), offset);
    offset += take;
  }
  return out;
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/transforms.js
var LOWER = "abcdefghijklmnopqrstuvwxyz";
var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var DIGITS = "0123456789";
var GIVEN_NAMES = ["Alex", "Avery", "Casey", "Emery", "Jordan", "Morgan", "Riley", "Robin"];
var FAMILY_NAMES = ["Arden", "Blake", "Hayes", "Lane", "Parker", "Reed", "Shaw", "Vale"];
var STREETS = ["Cedar", "Harbor", "Juniper", "Maple", "Orchard", "River", "Willow", "Summit"];
function alphabetFor(ch) {
  if (ch >= "0" && ch <= "9")
    return DIGITS;
  if (ch >= "a" && ch <= "z")
    return LOWER;
  if (ch >= "A" && ch <= "Z")
    return UPPER;
  return void 0;
}
function pseudonymize(value, secret) {
  const bytes = deriveBytes(secret, `pseudonym:${value}`, value.length);
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const alphabet = alphabetFor(value[i]);
    out += alphabet ? alphabet[bytes[i] % alphabet.length] : value[i];
  }
  return out;
}
function digitSurrogate(value, secret) {
  const bytes = deriveBytes(secret, `digits:${value}`, value.length);
  let out = "";
  for (let i = 0; i < value.length; i++) {
    out += /\d/.test(value[i]) ? DIGITS[bytes[i] % 10] : value[i];
  }
  return out;
}
function luhnCheckDigit(prefix) {
  const digits = prefix.replace(/\D/g, "");
  let sum = 0;
  let double = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9)
        n -= 9;
    }
    sum += n;
    double = !double;
  }
  return String((10 - sum % 10) % 10);
}
function cardSurrogate(value, secret) {
  const shaped = digitSurrogate(value, secret);
  const lastDigitIndex = shaped.search(/\d(?=\D*$)/);
  if (lastDigitIndex < 0)
    return shaped;
  const prefix = shaped.slice(0, lastDigitIndex);
  return prefix + luhnCheckDigit(prefix) + shaped.slice(lastDigitIndex + 1);
}
function emailSurrogate(value, secret) {
  const tag = hmacFingerprint(secret, `email:${value}`, 6);
  return `user_${tag}@example.invalid`;
}
function personSurrogate(value, secret) {
  const bytes = deriveBytes(secret, `person:${value}`, 2);
  return `${GIVEN_NAMES[bytes[0] % GIVEN_NAMES.length]} ${FAMILY_NAMES[bytes[1] % FAMILY_NAMES.length]}`;
}
function addressSurrogate(value, secret) {
  const bytes = deriveBytes(secret, `address:${value}`, 3);
  const number = 100 + (bytes[0] << 8 | bytes[1]) % 9800;
  return `${number} ${STREETS[bytes[2] % STREETS.length]} Street`;
}
function surrogate(value, detector, secret) {
  switch (detector.id) {
    case "email":
      return emailSurrogate(value, secret);
    case "credit_card":
      return cardSurrogate(value, secret);
    case "phone":
      return digitSurrogate(value, secret);
    case "person_name":
      return personSurrogate(value, secret);
    case "street_address":
      return addressSurrogate(value, secret);
    default:
      return pseudonymize(value, secret);
  }
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/terms.js
var escapeRe2 = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function normalizeTerms(input) {
  if (!input)
    return [];
  const list = Array.isArray(input) ? input.map((t) => typeof t === "string" ? { term: t } : t) : Object.entries(input).map(([term, replace]) => ({ term, replace }));
  return list.filter((t) => t.term && t.term.length > 0);
}
function buildTermsDetector(input, caseSensitive = false) {
  const list = normalizeTerms(input);
  if (!list.length)
    return null;
  const alt = [...list].sort((a, b) => b.term.length - a.term.length).map((t) => escapeRe2(t.term)).join("|");
  const flags = caseSensitive ? "gu" : "giu";
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alt})(?![\\p{L}\\p{N}_])`, flags);
  const key = (s) => caseSensitive ? s : s.toLowerCase();
  const replaceMap = new Map(list.map((t) => [key(t.term), t.replace ?? "***"]));
  return {
    id: "custom_term",
    label: "Custom term",
    why: "A term you configured as sensitive.",
    pattern,
    mask: (m) => replaceMap.get(key(m)) ?? "***",
    default: true,
    tags: ["custom"]
  };
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/confidence-model.js
var CONFIDENCE_MODEL = {
  version: 1,
  features: ["log2Len", "entropy", "fracLower", "fracUpper", "fracDigit", "fracSymbol", "fracHex", "vowelFrac", "classTransitionRate", "hasMixedClasses", "maxRunFrac", "structuredHexId", "ctxSecret", "ctxBenign"],
  weights: [2.712748, 3.920866, -5.874776, 5.484371, 1.346649, -9.662469, -0.058102, 8.500786, 2.714721, -0.676255, -3.0573, -6.969532, 5.6429, -5.446436],
  bias: -29.559382
};

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/ml.js
var FEATURES = [
  "log2Len",
  "entropy",
  "fracLower",
  "fracUpper",
  "fracDigit",
  "fracSymbol",
  "fracHex",
  "vowelFrac",
  "classTransitionRate",
  "hasMixedClasses",
  "maxRunFrac",
  "structuredHexId",
  "ctxSecret",
  "ctxBenign"
];
var FEATURE_COUNT = FEATURES.length;
var SECRET_CTX = /\b(secret|api[_-]?key|apikey|token|password|passwd|pwd|auth|authorization|bearer|access[_-]?key|private[_-]?key|client[_-]?secret|credential|signing[_-]?key)\b/i;
var BENIGN_CTX = /\b(uuid|guid|sha1|sha256|sha512|md5|hash|digest|etag|checksum|commit|revision|request[_-]?id|trace[_-]?id|correlation[_-]?id|span[_-]?id|object[_-]?id|content[_-]?id|version|colou?r|slug|filename)\b/i;
var STRUCTURED_HEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{24}|[0-9a-f]{32}|[0-9a-f]{40}|[0-9a-f]{64})$/i;
function shannonEntropy(s) {
  const freq = /* @__PURE__ */ new Map();
  let total = 0;
  for (const ch of s) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
    total++;
  }
  if (total === 0)
    return 0;
  let e = 0;
  for (const n of freq.values()) {
    const p = n / total;
    e -= p * Math.log2(p);
  }
  return e;
}
function extractFeatures(value, context = "") {
  const len = value.length || 1;
  let lower = 0, upper = 0, digit = 0, symbol = 0, hex = 0, vowel = 0, letters = 0;
  let transitions = 0, run = 1, maxRun = 1, prevClass = -1;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 97 && c <= 122) {
      lower++;
      letters++;
    } else if (c >= 65 && c <= 90) {
      upper++;
      letters++;
    } else if (c >= 48 && c <= 57)
      digit++;
    else
      symbol++;
    if (c >= 48 && c <= 57 || c >= 97 && c <= 102 || c >= 65 && c <= 70)
      hex++;
    if (c === 97 || c === 101 || c === 105 || c === 111 || c === 117 || c === 65 || c === 69 || c === 73 || c === 79 || c === 85)
      vowel++;
    const cls = c >= 48 && c <= 57 ? 1 : c >= 97 && c <= 122 || c >= 65 && c <= 90 ? 0 : 2;
    if (prevClass === -1)
      prevClass = cls;
    else {
      if (cls !== prevClass) {
        transitions++;
        run = 1;
      } else
        run++;
      if (run > maxRun)
        maxRun = run;
      prevClass = cls;
    }
  }
  const f = new Array(FEATURE_COUNT).fill(0);
  f[0] = Math.log2(len);
  f[1] = shannonEntropy(value);
  f[2] = lower / len;
  f[3] = upper / len;
  f[4] = digit / len;
  f[5] = symbol / len;
  f[6] = hex / len;
  f[7] = letters ? vowel / letters : 0;
  f[8] = len > 1 ? transitions / (len - 1) : 0;
  f[9] = lower > 0 && upper > 0 && digit > 0 ? 1 : 0;
  f[10] = maxRun / len;
  f[11] = STRUCTURED_HEX.test(value) ? 1 : 0;
  f[12] = SECRET_CTX.test(context) ? 1 : 0;
  f[13] = BENIGN_CTX.test(context) ? 1 : 0;
  return f;
}
var sigmoid = (z) => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
function secretProbability(value, context = "", model = CONFIDENCE_MODEL) {
  const x = extractFeatures(value, context);
  let z = model.bias;
  for (let j = 0; j < FEATURE_COUNT; j++)
    z += (model.weights[j] ?? 0) * x[j];
  return sigmoid(z);
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/engine.js
var FlareRedactError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FlareRedactError";
    this.code = code;
  }
};
var RedactionLimitError = class extends FlareRedactError {
  constructor(message) {
    super("ERR_REDACTION_LIMIT", message);
    this.name = "RedactionLimitError";
  }
};
function matches(entry, d) {
  return d.id === entry || (d.tags?.includes(entry) ?? false);
}
function resolveDetectors(opts) {
  const all = opts.custom?.length ? [...DETECTORS, ...opts.custom] : DETECTORS;
  let chosen;
  if (opts.only?.length) {
    chosen = all.filter((d) => opts.only.some((e) => matches(e, d)));
  } else {
    const { enable, disable } = opts;
    chosen = all.filter((d) => {
      const on = d.default || (enable?.some((e) => matches(e, d)) ?? false);
      const off = disable?.some((e) => matches(e, d)) ?? false;
      return on && !off;
    });
  }
  const termsDet = buildTermsDetector(opts.terms, opts.termsCaseSensitive);
  return termsDet ? [termsDet, ...chosen] : chosen;
}
function keyMatcher(opts) {
  const rk = opts.redactKeys;
  if (rk === false)
    return () => false;
  if (rk instanceof RegExp)
    return (k) => {
      rk.lastIndex = 0;
      return rk.test(k);
    };
  if (Array.isArray(rk)) {
    const set = new Set(rk.map((s) => s.toLowerCase()));
    return (k) => set.has(k.toLowerCase());
  }
  return (k) => SENSITIVE_KEY_RE.test(k) || MULTILANG_KEY_SET.has(k.toLowerCase());
}
function allowMatcher(opts) {
  const a = opts.allow;
  if (!a)
    return () => false;
  if (a instanceof RegExp)
    return (v) => {
      a.lastIndex = 0;
      return a.test(v);
    };
  const set = new Set(a);
  return (v) => set.has(v);
}
function makeReplacer(opts) {
  const secret = opts.transformSecret ?? opts.hashSalt ?? "";
  const mask2 = opts.mask;
  const mode = opts.mode ?? "mask";
  if (typeof mask2 === "string")
    return () => mask2;
  if (typeof mask2 === "function")
    return (value, det) => mask2({ value, detector: det });
  if (mode === "label")
    return (_value, det) => `[REDACTED:${det.id}]`;
  if (mode === "hash")
    return (value, det) => `${det.id}_${hmacFingerprint(secret, value)}`;
  if (mode === "pseudonym" || mode === "fpe")
    return (value) => pseudonymize(value, secret);
  if (mode === "surrogate")
    return (value, det) => surrogate(value, det, secret);
  return (value, det) => det.mask ? det.mask(value) : "***";
}
function withGlobal(re) {
  return re.flags.includes("g") ? re : new RegExp(re.source, re.flags + "g");
}
function normalizedView(text) {
  if (!/[\u200B\u200C\u200D\u2060\uFEFF]/.test(text))
    return { text };
  let normalized = "";
  const sourceIndex = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 8203 || code === 8204 || code === 8205 || code === 8288 || code === 65279)
      continue;
    normalized += text[i];
    sourceIndex.push(i);
  }
  return { text: normalized, sourceIndex };
}
function scanString(text, dets, allow, opts = {}) {
  const maxInputLength = opts.limits?.maxInputLength ?? 16 * 1024 * 1024;
  const maxFindings = opts.limits?.maxFindings ?? 5e4;
  if (text.length > maxInputLength) {
    throw new RedactionLimitError(`Input length ${text.length} exceeds the configured limit of ${maxInputLength}.`);
  }
  const normalized = normalizedView(text);
  const subject = normalized.text;
  const hits = [];
  for (const det of dets) {
    if (det.prefilter && !det.prefilter.some((literal) => subject.toLowerCase().includes(literal.toLowerCase())))
      continue;
    const re = withGlobal(det.pattern);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(subject)) !== null) {
      if (m.index === re.lastIndex)
        re.lastIndex++;
      const captured = det.capture === void 0 ? m[0] : m[det.capture];
      const normalizedValue = captured ?? "";
      if (!normalizedValue)
        continue;
      if (det.validate && !det.validate(normalizedValue))
        continue;
      const relativeStart = det.capture === void 0 ? 0 : m[0].indexOf(normalizedValue);
      if (relativeStart < 0)
        continue;
      const normalizedStart = m.index + relativeStart;
      const normalizedEnd = normalizedStart + normalizedValue.length;
      const start = normalized.sourceIndex?.[normalizedStart] ?? normalizedStart;
      const end = normalized.sourceIndex ? (normalized.sourceIndex[normalizedEnd - 1] ?? normalizedEnd - 1) + 1 : normalizedEnd;
      const value = text.slice(start, end);
      if (allow(value) || value !== normalizedValue && allow(normalizedValue))
        continue;
      const confidence = scoreConfidence(det, text, start, end, opts);
      if (confidence < (opts.minConfidence ?? 0))
        continue;
      hits.push({
        detector: det.id,
        label: det.label,
        why: det.why,
        value,
        start,
        end,
        risk: detectorRisk(det),
        confidence,
        det
      });
      if (hits.length > maxFindings) {
        throw new RedactionLimitError(`Finding count exceeds the configured limit of ${maxFindings}.`);
      }
    }
  }
  if (opts.semanticProvider) {
    const semanticFindings = opts.semanticProvider.detect(text);
    if (!Array.isArray(semanticFindings)) {
      throw new TypeError("Semantic provider is asynchronous; use scanAsync() or redactAsync().");
    }
    for (const finding of semanticFindings) {
      if (!Number.isInteger(finding.start) || !Number.isInteger(finding.end) || finding.start < 0 || finding.end <= finding.start || finding.end > text.length) {
        throw new TypeError(`Semantic provider returned an invalid span for ${finding.detector}.`);
      }
      const value = text.slice(finding.start, finding.end);
      if (allow(value) || (finding.confidence ?? 0.8) < (opts.minConfidence ?? 0))
        continue;
      const det = {
        id: finding.detector,
        label: finding.label,
        why: finding.why,
        pattern: /(?!)/,
        default: false,
        risk: finding.risk ?? "high",
        confidence: finding.confidence ?? 0.8
      };
      hits.push({ ...finding, value, risk: det.risk, confidence: det.confidence, det });
      if (hits.length > maxFindings) {
        throw new RedactionLimitError(`Finding count exceeds the configured limit of ${maxFindings}.`);
      }
    }
  }
  if (hits.length < 2)
    return hits;
  return selectNonOverlapping(hits);
}
function selectNonOverlapping(hits) {
  const sorted = [...hits].sort((a, b) => a.end - b.end || a.start - b.start);
  const previous = [];
  for (let i = 0; i < sorted.length; i++) {
    let lo = 0;
    let hi = i - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = lo + hi >>> 1;
      if (sorted[mid].end <= sorted[i].start) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    previous[i] = found;
  }
  const best = new Array(sorted.length + 1).fill(0);
  for (let i = 1; i <= sorted.length; i++) {
    const include = hitWeight(sorted[i - 1]) + best[previous[i - 1] + 1];
    best[i] = Math.max(best[i - 1], include);
  }
  const selected = [];
  for (let i = sorted.length; i > 0; ) {
    const hit = sorted[i - 1];
    const include = hitWeight(hit) + best[previous[i - 1] + 1];
    if (include > best[i - 1]) {
      selected.push(hit);
      i = previous[i - 1] + 1;
    } else {
      i--;
    }
  }
  return selected.reverse().sort((a, b) => a.start - b.start || a.end - b.end);
}
function hitWeight(hit) {
  const risk = hit.risk === "critical" ? 1e9 : hit.risk === "high" ? 1e6 : hit.risk === "medium" ? 1e3 : 1;
  return risk + (hit.det.priority ?? 0) * 10 + hit.confidence + (hit.end - hit.start) / 1e6;
}
function detectorRisk(det) {
  if (det.risk)
    return det.risk;
  if (det.tags?.includes("secret") || /(?:token|key|auth|credential|password|seed_phrase)/.test(det.id))
    return "critical";
  if (det.tags?.includes("pii") || /(?:email|phone|card|ssn|iban|person|address|dob)/.test(det.id))
    return "high";
  if (det.tags?.includes("network"))
    return "medium";
  return "high";
}
var REFINE_STRENGTH = 0.4;
function scoreConfidence(det, text, start, end, opts = {}) {
  let score = det.confidence ?? (det.id === "high_entropy" ? 0.6 : det.validate ? 0.99 : 0.92);
  if (det.context) {
    const radius = det.context.window ?? 80;
    const nearby = text.slice(Math.max(0, start - radius), Math.min(text.length, end + radius));
    if (det.context.positive) {
      det.context.positive.lastIndex = 0;
      if (det.context.positive.test(nearby))
        score += 0.06;
    }
    if (det.context.negative) {
      det.context.negative.lastIndex = 0;
      if (det.context.negative.test(nearby))
        score -= 0.25;
    }
  }
  if (opts.refineConfidence && det.refine) {
    const window = text.slice(Math.max(0, start - 64), Math.min(text.length, end + 64));
    const p = secretProbability(text.slice(start, end), window);
    score += (p - 0.5) * REFINE_STRENGTH;
  }
  return Math.max(0, Math.min(1, score));
}
function redactString(text, dets, allow, replace, opts = {}) {
  const hits = scanString(text, dets, allow, opts);
  if (!hits.length)
    return text;
  let out = "";
  let cursor = 0;
  for (const h of hits) {
    out += text.slice(cursor, h.start);
    out += replace(h.value, h.det);
    cursor = h.end;
  }
  return out + text.slice(cursor);
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/graph.js
function isAtomicObject(value) {
  return value instanceof Date || value instanceof RegExp || value instanceof Promise || value instanceof WeakMap || value instanceof WeakSet || value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}
function mapGraph(input, mapString, mapSensitiveValue) {
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (value) => {
    if (typeof value === "string")
      return mapString(value);
    if (!value || typeof value !== "object")
      return value;
    const cached = seen.get(value);
    if (cached !== void 0)
      return cached;
    if (value instanceof Error) {
      const out2 = Object.create(Object.getPrototypeOf(value));
      seen.set(value, out2);
      Object.defineProperties(out2, {
        name: { value: value.name, writable: true, configurable: true },
        message: { value: mapString(value.message), writable: true, configurable: true },
        ...typeof value.stack === "string" ? { stack: { value: mapString(value.stack), writable: true, configurable: true } } : {}
      });
      copyEnumerable(value, out2, walk, mapSensitiveValue);
      return out2;
    }
    if (value instanceof URL) {
      const out2 = new URL(mapString(value.toString()));
      seen.set(value, out2);
      return out2;
    }
    if (value instanceof URLSearchParams) {
      const out2 = new URLSearchParams(mapString(value.toString()));
      seen.set(value, out2);
      return out2;
    }
    if (isAtomicObject(value))
      return value;
    if (value instanceof Map) {
      const out2 = /* @__PURE__ */ new Map();
      seen.set(value, out2);
      for (const [key, entry] of value)
        out2.set(walk(key), walk(entry));
      return out2;
    }
    if (value instanceof Set) {
      const out2 = /* @__PURE__ */ new Set();
      seen.set(value, out2);
      for (const entry of value)
        out2.add(walk(entry));
      return out2;
    }
    if (Array.isArray(value)) {
      const out2 = new Array(value.length);
      seen.set(value, out2);
      for (let i = 0; i < value.length; i++) {
        if (Object.prototype.hasOwnProperty.call(value, i))
          out2[i] = walk(value[i]);
      }
      copyEnumerable(value, out2, walk, mapSensitiveValue, /* @__PURE__ */ new Set(["length", ...Object.keys(value).filter((k) => /^\d+$/.test(k))]));
      return out2;
    }
    const out = Object.create(Object.getPrototypeOf(value));
    seen.set(value, out);
    copyEnumerable(value, out, walk, mapSensitiveValue);
    return out;
  };
  return walk(input);
}
function copyEnumerable(source, target, walk, mapSensitiveValue, skip = /* @__PURE__ */ new Set()) {
  for (const key of Reflect.ownKeys(source)) {
    if (skip.has(key))
      continue;
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor?.enumerable || !("value" in descriptor))
      continue;
    const raw = descriptor.value;
    const next = typeof key === "string" && typeof raw === "string" && mapSensitiveValue ? mapSensitiveValue(key, raw) : walk(raw);
    Object.defineProperty(target, key, { ...descriptor, value: next });
  }
}

// ../../node_modules/.pnpm/flare-redact@1.4.1/node_modules/flare-redact/dist/index.js
function preparePolicy(opts) {
  return {
    opts,
    dets: resolveDetectors(opts),
    allow: allowMatcher(opts),
    replace: makeReplacer(opts),
    matchKey: keyMatcher(opts)
  };
}
function redactPrepared(input, policy) {
  const { opts, dets, allow, replace, matchKey } = policy;
  return mapGraph(input, (value) => redactString(value, dets, allow, replace, opts), (key, value) => matchKey(key) && !allow(value) ? replace(value, SENSITIVE_KEY_DETECTOR) : redactString(value, dets, allow, replace, opts));
}
function redact(input, opts = {}) {
  return redactPrepared(input, preparePolicy(opts));
}
function scanPrepared(input, policy) {
  const { opts, dets, allow, matchKey } = policy;
  const out = [];
  const seen = /* @__PURE__ */ new WeakSet();
  const push = (h, location, path) => {
    const { det: _det, ...f } = h;
    const safe = opts.includeValues ? f : withoutValue(f);
    out.push(path ? { ...safe, ...location, path } : { ...safe, ...location });
  };
  const walk = (value, path) => {
    if (typeof value === "string") {
      const hits = scanString(value, dets, allow, opts);
      let cursor = 0;
      let line = 1;
      let lineStart = 0;
      for (const h of hits) {
        const start = h.start ?? 0;
        while (cursor < start) {
          if (value.charCodeAt(cursor) === 10) {
            line++;
            lineStart = cursor + 1;
          }
          cursor++;
        }
        push(h, { line, column: start - lineStart + 1 }, path || void 0);
      }
    } else if (value && typeof value === "object") {
      if (seen.has(value))
        return;
      seen.add(value);
      if (value instanceof Error) {
        walk(value.message, path ? `${path}.message` : "message");
      }
      if (value instanceof URL || value instanceof URLSearchParams) {
        walk(value.toString(), path);
        return;
      }
      if (value instanceof Map) {
        let index = 0;
        for (const [key, entry] of value) {
          walk(key, `${path}.<map-key:${index}>`);
          walk(entry, `${path}.<map-value:${index}>`);
          index++;
        }
        return;
      }
      if (value instanceof Set) {
        let index = 0;
        for (const entry of value)
          walk(entry, `${path}[${index++}]`);
        return;
      }
      if (value instanceof Date || value instanceof RegExp || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        return;
      }
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor?.enumerable || !("value" in descriptor))
          continue;
        const v = descriptor.value;
        const name = typeof key === "symbol" ? `[${String(key)}]` : key;
        const child = path ? `${path}.${name}` : name;
        if (typeof key === "string" && typeof v === "string" && matchKey(key) && !allow(v)) {
          out.push({
            detector: "sensitive_key",
            label: "Sensitive field",
            why: `Value stored under a sensitive field name ("${key}").`,
            ...opts.includeValues ? { value: v } : {},
            path: child,
            risk: "critical",
            confidence: 0.98
          });
        } else {
          walk(v, child);
        }
      }
    }
  };
  walk(input, "");
  return out;
}
function scan(input, opts = {}) {
  return scanPrepared(input, preparePolicy(opts));
}
function withoutValue(finding) {
  const { value: _value, ...safe } = finding;
  return safe;
}
function isClean(input, opts = {}) {
  return scan(input, opts).length === 0;
}
function summary(input, opts = {}) {
  return summarizeFindings(scan(input, opts));
}
function summarizeFindings(findings) {
  const byDetector = {};
  const byRisk = {};
  for (const f of findings) {
    byDetector[f.detector] = (byDetector[f.detector] ?? 0) + 1;
    byRisk[f.risk] = (byRisk[f.risk] ?? 0) + 1;
  }
  return { total: findings.length, byDetector, byRisk };
}

// ../core/dist/config.js
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ../core/dist/defaults.js
var DEFAULT_SENSITIVE_TOOLS = ["Write", "Edit", "apply_patch", "NotebookEdit", "CreateFile"];
var DEFAULT_BLOCK_INSTEAD_OF_REDACT_TOOLS = ["Bash", "bash", "Shell"];
var DEFAULT_SENSITIVE_PATH_PATTERNS = [
  ".env",
  ".env.*",
  "**/.env*",
  "*.pem",
  "*.key",
  "*.p12",
  "*.pfx",
  "id_rsa",
  "id_ed25519",
  ".npmrc",
  ".netrc",
  ".pgpass",
  ".ssh/**",
  "**/.ssh/**",
  "**/secrets/**",
  "**/credentials*",
  "**/service-account*.json",
  "**/.aws/credentials",
  "**/.aws/config",
  "**/.azure/*",
  "**/settings_local.py"
];
var DEFAULT_SURFACES = {
  "tool.input": { mode: "redact", fallback: "block" },
  "tool.output": { mode: "redact", fallback: "block" },
  prompt: { mode: "redact", fallback: "block" },
  write: { mode: "block", fallback: "block" },
  sensitiveRead: { mode: "block", fallback: "block" }
};
function defaultPolicy() {
  return {
    mode: "mask",
    minConfidence: 0.6,
    refineConfidence: true
  };
}

// ../core/dist/config.js
var CONFIG_FILE_NAMES = ["flare-redact.config.json", ".flare-redact.json"];
function readConfigFile(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}
function normalizeConfig(config) {
  const surfaces = {};
  for (const name of Object.keys(DEFAULT_SURFACES)) {
    const base = DEFAULT_SURFACES[name];
    const override = config?.surfaces?.[name] ?? {};
    surfaces[name] = { mode: base.mode, fallback: base.fallback, ...override };
  }
  return {
    policy: { ...defaultPolicy(), ...config?.policy ?? {} },
    surfaces,
    sensitiveTools: config?.sensitiveTools ?? [],
    blockInsteadOfRedactTools: config?.blockInsteadOfRedactTools ?? [],
    sensitivePathPatterns: config?.sensitivePathPatterns ?? [],
    audit: { enabled: config?.audit?.enabled ?? true, sink: config?.audit?.sink }
  };
}
function applyEnvOverrides(base, env = process.env) {
  const cfg = { ...base };
  const policy = { ...base.policy ?? {} };
  const mode = env.FLARE_REDACT_MODE;
  if (mode === "mask" || mode === "label" || mode === "hash" || mode === "pseudonym" || mode === "surrogate" || mode === "fpe") {
    policy.mode = mode;
  }
  if (env.FLARE_REDACT_ENABLE) {
    policy.enable = env.FLARE_REDACT_ENABLE.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (env.FLARE_REDACT_MIN_CONFIDENCE) {
    const n = Number(env.FLARE_REDACT_MIN_CONFIDENCE);
    if (Number.isFinite(n))
      policy.minConfidence = n;
  }
  const surfaceMode = env.FLARE_REDACT_SURFACE_MODE;
  if (surfaceMode === "redact" || surfaceMode === "observe" || surfaceMode === "block") {
    cfg.surfaces = {
      "tool.input": { mode: surfaceMode },
      "tool.output": { mode: surfaceMode },
      prompt: { mode: surfaceMode },
      write: { mode: surfaceMode },
      sensitiveRead: { mode: surfaceMode }
    };
  }
  cfg.policy = policy;
  return cfg;
}
function walkUpForConfig(cwd) {
  let dir = cwd;
  for (; ; ) {
    for (const name of CONFIG_FILE_NAMES) {
      const file = join(dir, name);
      try {
        readFileSync(file, "utf8");
        return { file, dir };
      } catch {
      }
    }
    const parent = dir.replace(/[\\/][^\\/]*$/, "") || dir;
    if (parent === dir)
      return null;
    dir = parent;
  }
}

// ../core/dist/glob.js
function globToRegExp(glob) {
  let g = glob.replace(/\\/g, "/");
  if (!g.includes("/"))
    g = `**/${g}`;
  let src = "";
  for (let i = 0; i < g.length; i++) {
    const ch = g[i];
    if (ch === "*") {
      if (g[i + 1] === "*") {
        const consume = g[i + 2] === "/";
        src += consume ? "(?:.*/)?" : ".*";
        i += consume ? 2 : 1;
      } else {
        src += "[^/]*";
      }
    } else if (ch === "?") {
      src += "[^/]";
    } else {
      src += escapeRegExp(ch);
    }
  }
  return new RegExp(`^${src}$`, "i");
}
function escapeRegExp(ch) {
  return /[.+^${}()|[\]\\/]/.test(ch) ? `\\${ch}` : ch;
}
function isSensitivePath(path, patterns) {
  const normalized = path.replace(/\\/g, "/");
  for (const pattern of patterns) {
    if (globToRegExp(pattern).test(normalized))
      return true;
  }
  return false;
}

// ../core/dist/guard.js
function createGuard(config) {
  const normalized = normalizeConfig(applyEnvOverrides(config));
  const policy = normalized.policy;
  const sensitiveTools = new Set([...DEFAULT_SENSITIVE_TOOLS, ...normalized.sensitiveTools].map((t) => t.toLowerCase()));
  const blockTools = new Set([...DEFAULT_BLOCK_INSTEAD_OF_REDACT_TOOLS, ...normalized.blockInsteadOfRedactTools].map((t) => t.toLowerCase()));
  const pathPatterns = [...DEFAULT_SENSITIVE_PATH_PATTERNS, ...normalized.sensitivePathPatterns];
  const audit = (event) => {
    if (!normalized.audit.enabled)
      return;
    normalized.audit.sink?.(event);
  };
  function toSafe(findings) {
    return findings.map((f) => ({
      detector: f.detector,
      label: f.label,
      why: f.why,
      risk: f.risk,
      confidence: f.confidence,
      start: f.start,
      end: f.end,
      line: f.line,
      column: f.column,
      path: f.path
    }));
  }
  function detect(input) {
    return toSafe(scan(input, { ...policy, includeValues: false }));
  }
  function blockReason(findings) {
    const labels = [...new Set(findings.map((f) => f.label))];
    return `flare-redact: blocked \u2014 detected ${labels.join(", ")} (${findings.length} finding${findings.length === 1 ? "" : "s"}). Review before proceeding.`;
  }
  function noteFor(findings) {
    const labels = [...new Set(findings.map((f) => f.label))];
    return `flare-redact: ${labels.join(", ")} detected and redacted (${findings.length} finding${findings.length === 1 ? "" : "s"}).`;
  }
  function surfaceMode(name) {
    return normalized.surfaces[name].mode;
  }
  function surfaceForInput(meta) {
    const tool = (meta.tool ?? "").toLowerCase();
    if (sensitiveTools.has(tool))
      return "write";
    if (tool === "read" && meta.filePath && isSensitivePath(meta.filePath, pathPatterns))
      return "sensitiveRead";
    return "tool.input";
  }
  function emit(surface, meta, action, findings) {
    audit({
      surface,
      tool: meta.tool,
      sessionID: meta.sessionID,
      action,
      count: findings.length,
      detectors: [...new Set(findings.map((f) => f.detector))],
      risks: [...new Set(findings.map((f) => f.risk))],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  function toolInput(meta, args) {
    const surface = surfaceForInput(meta);
    if (surface === "sensitiveRead") {
      emit(surface, meta, "block", []);
      return {
        decision: "block",
        reason: `flare-redact: blocked \u2014 reading sensitive path ${meta.filePath ?? "(unknown)"}.`,
        findings: []
      };
    }
    const findings = detect(args);
    if (findings.length === 0)
      return { decision: "allow" };
    const tool = (meta.tool ?? "").toLowerCase();
    const mode = surfaceMode(surface);
    const effective = mode === "redact" && blockTools.has(tool) ? "block" : mode;
    switch (effective) {
      case "observe":
        emit(surface, meta, "observe", findings);
        return { decision: "observe", findings };
      case "block":
        emit(surface, meta, "block", findings);
        return { decision: "block", reason: blockReason(findings), findings };
      default:
        emit(surface, meta, "redact", findings);
        return { decision: "redact", value: redact(args, policy), findings };
    }
  }
  function toolOutput(meta, output) {
    const findings = detect(output);
    if (findings.length === 0)
      return { decision: "allow" };
    const mode = surfaceMode("tool.output");
    switch (mode) {
      case "observe":
        emit("tool.output", meta, "observe", findings);
        return { decision: "observe", findings };
      case "block":
        emit("tool.output", meta, "block", findings);
        return { decision: "block", reason: blockReason(findings), findings };
      default:
        emit("tool.output", meta, "redact", findings);
        return { decision: "redact", value: redact(output, policy), findings };
    }
  }
  function prompt(meta, text) {
    const findings = detect(text);
    if (findings.length === 0)
      return { decision: "allow" };
    const mode = surfaceMode("prompt");
    switch (mode) {
      case "observe":
        emit("prompt", meta, "observe", findings);
        return { decision: "annotate", note: noteFor(findings), findings };
      case "block":
        emit("prompt", meta, "block", findings);
        return { decision: "block", reason: blockReason(findings), findings };
      default:
        emit("prompt", meta, "redact", findings);
        return { decision: "rewrite", text: redact(text, policy), findings };
    }
  }
  function verify(input) {
    const findings = detect(input);
    const s = summary(input, policy);
    return {
      clean: isClean(input, policy),
      total: s.total,
      findings,
      byDetector: s.byDetector,
      byRisk: s.byRisk
    };
  }
  return {
    toolInput,
    toolOutput,
    prompt,
    verify,
    sanitize: (value) => redact(value, policy),
    isSensitivePath: (path) => isSensitivePath(path, pathPatterns),
    surface: (name) => normalized.surfaces[name],
    policy,
    auditSink: audit
  };
}
function loadGuard(cwd, extra) {
  const found = walkUpForConfig(cwd);
  const raw = found ? readConfigFile(found.file) : {};
  return createGuard({
    ...raw,
    ...extra,
    policy: { ...raw.policy ?? {}, ...extra?.policy ?? {} },
    audit: { ...raw.audit ?? {}, ...extra?.audit ?? {} }
  });
}
function adaptPrompt(decision, caps) {
  switch (decision.decision) {
    case "allow":
      return { action: "allow" };
    case "rewrite":
      if (caps.canRewritePrompt)
        return { action: "rewrite", value: decision.text, findings: decision.findings };
      return { action: "block", reason: fallbackReason(decision.findings), findings: decision.findings };
    case "block":
      return { action: "block", reason: decision.reason, findings: decision.findings };
    case "annotate":
      return { action: "annotate", reason: decision.note, findings: decision.findings };
  }
}
function fallbackReason(findings) {
  const labels = [...new Set(findings.map((f) => f.label))];
  return `flare-redact: ${labels.join(", ")} detected; redaction not supported on this platform.`;
}

// src/hook.ts
function auditSinkFromEnv() {
  const file = process.env.FLARE_REDACT_AUDIT_FILE;
  if (!file) return void 0;
  return (event) => {
    try {
      appendFileSync(file, `${JSON.stringify(event)}
`);
    } catch {
    }
  };
}
function guardFor(input, cwdHint) {
  const cwd = cwdHint ?? input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  return loadGuard(cwd, { audit: { sink: auditSinkFromEnv() } });
}
function preToolUse(input, guard) {
  const d = guard.toolInput({ tool: input.tool_name, sessionID: input.session_id }, input.tool_input ?? {});
  switch (d.decision) {
    case "block":
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: d.reason
        }
      });
    case "redact":
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          updatedInput: d.value
        }
      });
    default:
      return null;
  }
}
function userPromptSubmit(input, guard) {
  const d = guard.prompt({ sessionID: input.session_id }, input.prompt ?? "");
  const a = adaptPrompt(d, { canRewritePrompt: false });
  if (a.action === "block") return JSON.stringify({ decision: "block", reason: a.reason });
  return null;
}
function postToolUse(input, guard) {
  const d = guard.toolOutput({ tool: input.tool_name, sessionID: input.session_id }, input.tool_response);
  switch (d.decision) {
    case "block":
      return JSON.stringify({ systemMessage: d.reason });
    case "redact":
      return JSON.stringify({ systemMessage: `${d.findings.length} secret/PII finding(s) were present in tool output; redaction is not supported on Codex.` });
    default:
      return null;
  }
}

// src/cli.ts
function readStdin() {
  return new Promise((done, fail) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(Buffer.from(c)));
    process.stdin.on("end", () => done(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", fail);
  });
}
async function main() {
  const mode = process.argv[2] ?? "PreToolUse";
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const guard = guardFor(input);
  let out = null;
  switch (mode) {
    case "PreToolUse":
      out = preToolUse(input, guard);
      break;
    case "PostToolUse":
      out = postToolUse(input, guard);
      break;
    case "UserPromptSubmit":
      out = userPromptSubmit(input, guard);
      break;
    case "verify": {
      const target = process.argv[3] ?? "-";
      const text = target === "-" ? raw : readFileSync2(resolve(process.cwd(), target), "utf8");
      const report = guard.verify(text);
      process.stdout.write(`${JSON.stringify(report, null, 2)}
`);
      process.exit(report.clean ? 0 : 1);
      return;
    }
    default:
      process.exit(0);
  }
  if (out) process.stdout.write(out);
  process.exit(0);
}
main().catch(() => process.exit(0));
