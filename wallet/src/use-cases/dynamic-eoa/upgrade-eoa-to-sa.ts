import {
  getSmartAccountsEnvironment,
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/smart-accounts-kit";
import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import {
  createPublicClient,
  http,
  zeroAddress,
  type Chain,
  type PublicClient,
} from "viem";
import { baseSepolia } from "viem/chains";
import type { CreatedEvmWallet, Erc7702UpgradeOptions } from "../../domain/index.js";
import { Wallet } from "../../domain/index.js";

async function upgradeOneWallet(
  wallet: CreatedEvmWallet,
  dynamicClient: DynamicEvmWalletClient,
  password: string | undefined,
  publicClient: PublicClient,
  chain: Chain,
  rpcUrl: string,
): Promise<Wallet> {
  const aggregate = Wallet.fromDynamicCreated(wallet);

  const walletClient = await dynamicClient.getWalletClient({
    accountAddress: wallet.accountAddress,
    chain,
    rpcUrl,
    ...(password !== undefined ? { password } : {}),
  });

  const account = walletClient.account;
  if (!account) {
    throw new Error("erc7702: Dynamic wallet client has no account");
  }

  const environment = getSmartAccountsEnvironment(chain.id);
  const contractAddress =
    environment.implementations.EIP7702StatelessDeleGatorImpl;

  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress,
    executor: "self",
  });
  aggregate.markDelegationSigned();

  const hash = await walletClient.sendTransaction({
    account,
    chain,
    authorizationList: [authorization],
    data: "0x",
    to: zeroAddress,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  aggregate.recordSetCodeTransaction(hash);

  const addresses = await walletClient.getAddresses();
  const address = addresses[0];
  if (!address) {
    throw new Error("erc7702: wallet client returned no addresses");
  }

  const delegator = await toMetaMaskSmartAccount({
    client: publicClient as never,
    implementation: Implementation.Stateless7702,
    address,
    signer: { walletClient: walletClient as never },
  });

  aggregate.markSmartAccount(delegator.address);
  return aggregate;
}

/**
 * For each wallet: EIP-7702 authorization + type-0x04 set-code tx, then
 * {@link toMetaMaskSmartAccount} (Stateless7702).
 *
 * Requires funded EOAs on the target chain for gas. Chain defaults to Base Sepolia.
 */
export async function upgradeEoaToSa(
  wallets: CreatedEvmWallet[],
  options: Erc7702UpgradeOptions,
): Promise<Wallet[]> {
  const { dynamicClient, password, rpcUrl, chain: chainOpt } = options;
  const chain = chainOpt ?? baseSepolia;

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const out: Wallet[] = [];
  for (const w of wallets) {
    out.push(
      await upgradeOneWallet(
        w,
        dynamicClient,
        password,
        // Duplicate viem installs under pnpm make two incompatible `PublicClient` types.
        publicClient as unknown as PublicClient,
        chain,
        rpcUrl,
      ),
    );
  }
  return out;
}
