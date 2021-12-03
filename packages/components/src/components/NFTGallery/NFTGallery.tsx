import React, { useEffect } from 'react';
import fetch from 'cross-fetch';
import { ethers } from 'ethers';
import { VStack, Heading, Grid, Alert, AlertIcon } from '@chakra-ui/react';
import { NFT } from '../NFT';

export interface NFTGalleryProps {
  address: string;
  gridWidth?: number;
  web3Provider?: ethers.providers.Web3Provider;
}

export interface OpenSeaAsset {
  token_id: string;
  image_url: string;
  name: string | null;
  asset_contract: {
    name: string;
    symbol: string;
  };
}

/**
 * @dev Component to display a grid of NFTs owned by an address. It uses the OpenSea API to fetch
 * the NFTs.
 */
export const NFTGallery = ({ address, gridWidth = 4, web3Provider }: NFTGalleryProps) => {
  const [nfts, setNfts] = React.useState<OpenSeaAsset[]>([]);
  const [errorMessage, setErrorMessage] = React.useState();

  useEffect(() => {
    async function exec() {
      let resolvedAddress: string | null = address;
      if (address.endsWith('.eth')) {
        if (!web3Provider) {
          return console.error('Please provide a web3 provider');
        }
        resolvedAddress = await web3Provider.resolveName(address);
      }
      fetch(`https://api.opensea.io/api/v1/assets?owner=${resolvedAddress}`)
        .then((res) => {
          if (!res.ok) {
            throw Error(`OpenSea request failed with status: ${res.status}.`);
          }
          return res.json();
        })
        .then((data) => setNfts(data.assets))
        .catch((err) => setErrorMessage(err.message));
    }
    exec();
  }, [address, web3Provider]);

  return (
    <VStack>
      <Heading size='lg'>NFT Gallery</Heading>
      {errorMessage && (
        <Alert status='error'>
          <AlertIcon />
          {errorMessage}
        </Alert>
      )}
      <Grid templateColumns={`repeat(${gridWidth}, 1fr)`} gap={6}>
        {nfts.map((nft) => (
          <NFT
            key={`${nft.asset_contract.symbol}-${nft.token_id}`}
            tokenId={nft.token_id}
            name={nft.name}
            imageUrl={nft.image_url}
            assetContractName={nft.asset_contract.name}
            assetContractSymbol={nft.asset_contract.symbol}
          />
        ))}
      </Grid>
    </VStack>
  );
};
