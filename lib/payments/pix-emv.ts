/**
 * Utilitário EMV® QRCPS-MPM (Padrão BR Code Pix do Banco Central)
 * com cálculo de CRC16-CCITT (0xFFFF, polinômio 0x1021) e geração de SVG Base64.
 */

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function computeCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixBrCode(params: {
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txid: string;
}): string {
  const key = params.pixKey || "financeiro@bbbshopbrasil.com.br";
  const name = (params.merchantName || "BBB SHOP BRASIL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .slice(0, 25)
    .toUpperCase();
  const city = (params.merchantCity || "SAO PAULO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .slice(0, 15)
    .toUpperCase();
  const cleanTxid =
    params.txid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "BBBSHOP001";

  const merchantAccountInfo =
    formatEmvField("00", "br.gov.bcb.pix") + formatEmvField("01", key);

  const additionalData = formatEmvField("05", cleanTxid);

  const body =
    formatEmvField("00", "01") +
    formatEmvField("01", "12") +
    formatEmvField("26", merchantAccountInfo) +
    formatEmvField("52", "0000") +
    formatEmvField("53", "986") +
    formatEmvField("54", params.amount.toFixed(2)) +
    formatEmvField("58", "BR") +
    formatEmvField("59", name) +
    formatEmvField("60", city) +
    formatEmvField("62", additionalData) +
    "6304";

  const crc = computeCrc16(body);
  return `${body}${crc}`;
}

/**
 * Gera uma imagem SVG determinística em data URI (base64) representando o QR Code
 * quando o gateway está em modo sandbox/demonstração local.
 */
export function buildQrCodeSvgDataUri(seedText: string): string {
  const size = 21;
  const cells: string[] = [];

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) ||
    (r < 7 && c >= size - 7) ||
    (r >= size - 7 && c < 7);

  const isFinderDark = (r: number, c: number) => {
    const lr = r >= size - 7 ? r - (size - 7) : r;
    const lc = c >= size - 7 ? c - (size - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let dark = false;
      if (isFinder(r, c)) {
        dark = isFinderDark(r, c);
      } else {
        const bitIndex = (r * size + c) % Math.max(1, seedText.length);
        const charCode = seedText.charCodeAt(bitIndex);
        dark = ((charCode + r * 17 + c * 31 + (hash & 0xff)) & 1) === 0;
      }
      if (dark) {
        cells.push(
          `<rect x="${c + 2}" y="${r + 2}" width="1" height="1" fill="#1F1A16"/>`
        );
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${
    size + 4
  } ${size + 4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#FDFBF7"/>${cells.join(
    ""
  )}</svg>`;

  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

