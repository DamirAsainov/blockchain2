// Current balance is 4.864940515
// PublicKey: GDYRfLwxGCLKwsPjdVcjWfgBfYqvLQkuxeGUVqpnY4PY
// image uri: https://arweave.net/aPTf4JyK34QnfcsotlLpcM3sHSgGsxZEh1Hk_GcDMdo
// metadata uri: https://arweave.net/Ldj8JDs4ikemiKC8_UBvw_YDizWa10-5kHRmi3CnCcQ
// Collection Mint: https://explorer.solana.com/address/GZCB97pPnADmVqDwSwfMhXE5LQKp7oKkNPNfxc7kygNJ?cluster=devnet
// image uri: https://arweave.net/FtLuMRB6f8kiyzfTVPqL0dffDkbJO2TZ1C2Mx1IhC-Q
// metadata uri: https://arweave.net/xP9PVHrF0cO_1ncW1L4-ysryllqPJCrT0v09hObxcRY
// Token Mint: https://explorer.solana.com/address/6nvRZvUbfH7NQymEZBQprdHxzdFMi1PQtCRcks3JXwBr?cluster=devnet
// image uri: https://arweave.net/SrkFJ83mpUKH6LlRx6OPkK4-3TGQujkFcET-Diq135s
// metadata uri: https://arweave.net/GE5SL0_yhQvIEfLyLr4KM4EMkWThlP6157o6sl32ndE
// Token Mint: https://explorer.solana.com/address/6nvRZvUbfH7NQymEZBQprdHxzdFMi1PQtCRcks3JXwBr?cluster=devnet
// Transaction: https://explorer.solana.com/tx/5snrQkTx1NgKEQ9fn3PmWSVQxU5qdwRMsmuY1jUGxhPiWKpd3Ekzn9FmDbN5HiYtRGhQXVxS4xRL619p51WnLha1?cluster=devnet  
// Finished successfully


import { initializeKeypair } from "./initializeKeypair"
import { Connection, clusterApiUrl, PublicKey, Signer } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"

interface NftData {
  name: string
  symbol: string
  description: string
  sellerFeeBasisPoints: number
  imageFile: string
}

interface CollectionNftData {
  name: string
  symbol: string
  description: string
  sellerFeeBasisPoints: number
  imageFile: string
  isCollection: boolean
  collectionAuthority: Signer
}

// example data for a new NFT
const nftData = {
  name: "Sniper gun",
  symbol: "DSCol",
  description: "Rate limited",
  sellerFeeBasisPoints: 10,
  imageFile: "solana.png",
}

// example data for updating an existing NFT
const updateNftData = {
  name: "Dosyan Academy logo",
  symbol: "DOSYAN_COLLECTION",
  description: "...WOW",
  sellerFeeBasisPoints: 100,
  imageFile: "success.png",
}

async function uploadMetadata(
  metaplex: Metaplex,
  nftData: NftData
): Promise<string> {
  // file to buffer
  const buffer = fs.readFileSync("src/" + nftData.imageFile)

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, nftData.imageFile)

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex.nfts().uploadMetadata({
    name: nftData.name,
    symbol: nftData.symbol,
    description: nftData.description,
    image: imageUri,
  })

  console.log("metadata uri:", uri)
  return uri
}

async function createNft(
  metaplex: Metaplex,
  uri: string,
  nftData: NftData,
  collectionMint: PublicKey
): Promise<NftWithToken> {
  const { nft } = await metaplex.nfts().create(
    {
      uri: uri, // metadata URI
      name: nftData.name,
      sellerFeeBasisPoints: nftData.sellerFeeBasisPoints,
      symbol: nftData.symbol,
      collection: collectionMint,
    },
    { commitment: "finalized" }
  )

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  await metaplex.nfts().verifyCollection({
    //this is what verifies our collection as a Certified Collection
    mintAddress: nft.mint.address,
    collectionMintAddress: collectionMint,
    isSizedCollection: true,
  })

  return nft
}

async function createCollectionNft(
  metaplex: Metaplex,
  uri: string,
  data: CollectionNftData
): Promise<NftWithToken> {
  const { nft } = await metaplex.nfts().create(
    {
      uri: uri,
      name: data.name,
      sellerFeeBasisPoints: data.sellerFeeBasisPoints,
      symbol: data.symbol,
      isCollection: true,
    },
    { commitment: "finalized" }
  )

  console.log(
    `Collection Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  return nft
}

// helper function update NFT
async function updateNftUri(
  metaplex: Metaplex,
  uri: string,
  mintAddress: PublicKey
) {
  // fetch NFT data using mint address
  const nft = await metaplex.nfts().findByMint({ mintAddress })

  // update the NFT metadata
  const { response } = await metaplex.nfts().update(
    {
      nftOrSft: nft,
      uri: uri,
    },
    { commitment: "finalized" }
  )

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  console.log(
    `Transaction: https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  )
}

async function main() {
  // create a new connection to the cluster's API
  const connection = new Connection(clusterApiUrl("devnet"))

  // initialize a keypair for the user
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())

  // metaplex set up
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )

  const collectionNftData = {
    name: "DosyanCollection",
    symbol: "DSCol",
    description: "...Dello dowrld",
    sellerFeeBasisPoints: 100,
    imageFile: "success.png",
    isCollection: true,
    collectionAuthority: user,
  }

  // upload data for the collection NFT and get the URI for the metadata
  const collectionUri = await uploadMetadata(metaplex, collectionNftData)

  // create a collection NFT using the helper function and the URI from the metadata
  const collectionNft = await createCollectionNft(
    metaplex,
    collectionUri,
    collectionNftData
  )

  // upload the NFT data and get the URI for the metadata
  const uri = await uploadMetadata(metaplex, nftData)

  // create an NFT using the helper function and the URI from the metadata
  const nft = await createNft(
    metaplex,
    uri,
    nftData,
    collectionNft.mint.address
  )

  // upload updated NFT data and get the new URI for the metadata
  const updatedUri = await uploadMetadata(metaplex, updateNftData)

  // update the NFT using the helper function and the new URI from the metadata
  await updateNftUri(metaplex, updatedUri, nft.address)
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
