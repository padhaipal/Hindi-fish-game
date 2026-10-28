// The STT keys live on the LIFTeracy STT server (lifteracy-app/server, a
// Vercel project), not on the phones. The app only needs the server's address,
// and the access code if the server has one set. Both default to the build's
// values and can be changed in Settings.
export interface SttServer {
  url: string;
  accessCode: string;
}

const KEY = "lifteracy.sttServer.v1";

export const DEFAULT_SERVER: SttServer = {
  url: import.meta.env.VITE_STT_SERVER_URL || "https://lifteracy-stt.vercel.app",
  accessCode: import.meta.env.VITE_STT_ACCESS_CODE || "",
};

export function loadServer(): SttServer {
  try {
    return { ...DEFAULT_SERVER, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULT_SERVER;
  }
}

export function saveServer(server: SttServer) {
  try {
    localStorage.setItem(KEY, JSON.stringify(server));
  } catch {
    // ignore: the defaults are used next time
  }
}

export const sttEndpoint = (server: SttServer) => `${server.url.replace(/\/+$/, "")}/api/stt`;
