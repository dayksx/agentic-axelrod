"use client";

import { useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

/**
 * If both Email and Wallet sign-in are enabled in the Dynamic dashboard, the
 * widget defaults to the email tab. This selects the wallet flow first.
 *
 * To remove email from the flow entirely, turn off Email (and any required
 * email onboarding fields) in the Dynamic dashboard — the SDK cannot disable
 * server-side sign-in methods from code.
 */
export function PreferWalletLoginTab() {
  const { setLogInWithEmail } = useDynamicContext();

  useEffect(() => {
    setLogInWithEmail(false);
  }, [setLogInWithEmail]);

  return null;
}
