// xrpl-client.ts
import { Client } from "xrpl";

let client: Client | null = null;

export const initXrplClient = async () => {
  if (!client) {
    client = new Client("wss://s.altnet.rippletest.net:51233"); // Testnet
    await client.connect();
  }
  return client;
};

export const getXrplClient = async (): Promise<Client> => {
  if (!client || !client.isConnected()) {
    return await initXrplClient();
  }
  return client;
};

export const subscribeToAccount = async (
  address: string,
  onEvent: (event: unknown) => void
) => {
  const c = await initXrplClient();
  await c.request({
    command: "subscribe",
    accounts: [address],
  });

  c.on("transaction", (tx) => {
    if (tx.validated) {
      onEvent(tx);
    }
  });
};
