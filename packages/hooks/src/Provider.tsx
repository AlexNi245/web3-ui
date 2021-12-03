import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider';
import React from 'react';
import { ethers } from 'ethers';
import WalletLink from 'walletlink';
import { ledgerProviderOptions } from '@rsksmart/rlogin-ledger-provider';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3Modal from 'web3modal';

export interface Web3ContextType {
  connectWallet?: () => void;
  signer?: JsonRpcSigner | null;
  userAddress?: string | null;
  disconnectWallet?: () => void;
  network: string;
  chainId?: number;
  connected: boolean;
  provider?: ethers.providers.Web3Provider | null;
}

export const Web3Context = React.createContext<Web3ContextType | undefined>(undefined);

export interface ProviderProps {
  /**
   * @dev The network you want to connect to.
   * @example 'mainnet'
   * @type string
   */
  network: string;
  /**
   * @dev Your Infura project ID. This is required if you want to support WalletConnect.
   * @type string
   */
  infuraId?: string;
}

/**
 * @dev The global provider that handles and stores all the web3 connections. Wrap your entire App with this component.
 * @param children Your app.
 * @param network The network you want to connect to.
 * @param infuraId Your Infura project ID. This is required if you want to support WalletConnect.
 */
export const Provider: React.FC<ProviderProps> = ({ children, network, infuraId }) => {
  const [signer, setSigner] = React.useState<null | JsonRpcSigner>();
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider>();
  const [userAddress, setUserAddress] = React.useState<null | string>();
  const [web3Modal, setWeb3Modal] = React.useState<Web3Modal>();
  const [chainId, setChainId] = React.useState<number>();
  const [connected, setConnected] = React.useState<boolean>(false);

  const connectWallet = React.useCallback(async () => {
    // Coinbase walletLink init
    const walletLink = new WalletLink({
      appName: 'coinbase',
    });

    // WalletLink provider
    const walletLinkProvider = walletLink.makeWeb3Provider(
      'https://eth-mainnet.alchemyapi.io/v2/qCdzfF9UqXcJYIle-Ff-BN0MII8LjLQs',
      1
    );

    const web3Modal = new Web3Modal({
      network,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            bridge: 'https://polygon.bridge.walletconnect.org',
            infuraId,
            rpc: {
              1: 'https://eth-mainnet.alchemyapi.io/v2/qCdzfF9UqXcJYIle-Ff-BN0MII8LjLQs', // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
              42: infuraId,
              100: 'https://dai.poa.network', // xDai
            },
          },
        },
        'custom-walletlink': {
          display: {
            logo: 'https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0',
            name: 'Coinbase',
            description: 'Connect to Coinbase Wallet (not Coinbase App)',
          },
          package: walletLinkProvider,
          // @ts-ignore
          connector: async (provider, options) => {
            await provider.enable();
            return provider;
          },
        },
        'custom-ledger': {
          ...ledgerProviderOptions,
          // rpc: { 31: 'https://public-node.testnet.rsk.co' },
          // chainId: 31,
        },
      },
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    setWeb3Modal(web3Modal);
    setSigner(signer);
    setProvider(provider);
    setUserAddress(await signer.getAddress());
    setChainId(await signer.getChainId());
    setConnected(true);
  }, [Web3Modal, web3Modal, WalletConnectProvider, network, infuraId, ethers]);

  const disconnectWallet = React.useCallback(() => {
    web3Modal?.clearCachedProvider();
    setSigner(null);
    setUserAddress(null);
    setConnected(false);
  }, [web3Modal]);

  const value = React.useMemo(
    () => ({
      connectWallet,
      signer,
      userAddress,
      disconnectWallet,
      connected,
      provider,
      network,
      chainId,
    }),
    [connectWallet, signer, userAddress, web3Modal, connected, provider, network, chainId]
  );

  return <Web3Context.Provider value={{ ...value }}>{children}</Web3Context.Provider>;
};
