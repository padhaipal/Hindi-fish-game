// STT keys are pasted into the app's Settings screen and kept on this phone
// only (never in the code or the APK).
export interface SttKeys {
  sarvamKey: string;
  azureKey: string;
  azureEndpoint: string; // e.g. https://centralindia.api.cognitive.microsoft.com
  bodhanKey: string;
}

const KEY = "lifteracy.sttKeys.v1";

export const EMPTY_KEYS: SttKeys = { sarvamKey: "", azureKey: "", azureEndpoint: "", bodhanKey: "" };

export function loadKeys(): SttKeys {
  try {
    return { ...EMPTY_KEYS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return EMPTY_KEYS;
  }
}

export function saveKeys(keys: SttKeys) {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys));
  } catch {
    // ignore: the keys just won't survive a restart
  }
}

export function enabledEngines(keys: SttKeys): string[] {
  const engines: string[] = [];
  if (keys.sarvamKey) engines.push("Sarvam");
  if (keys.azureKey && keys.azureEndpoint) engines.push("Azure");
  if (keys.bodhanKey) engines.push("Bodhan");
  return engines;
}
