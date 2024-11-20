import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button, Alert } from 'react-bootstrap'
import axios from 'axios'

const pinataApiKey = 'c8974ade8a91d87a55ac';
const pinataSecretApiKey = 'bd362ea72c991e4d9139cd69a2b4dd8de26c92c2d3a16d3404b68033734cdc8e';

const pinataAuth = {
  headers: {
    'pinata_api_key': pinataApiKey,
    'pinata_secret_api_key': pinataSecretApiKey,
  }
};

const Create = ({ marketplace, nft, setError }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState('')

  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        setUploading(true)
        setLocalError('')
        
        const formData = new FormData()
        formData.append('file', file)

        const result = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, pinataAuth)
        console.log('Pinata IPFS Result:', result.data)
        
        setImage(`https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`)
        setUploading(false)
      } catch (error) {
        console.error("Pinata image upload error: ", error)
        setLocalError('Failed to upload image. Please try again.')
        setUploading(false)
      }
    }
  }

  const createNFT = async () => {
    if (!image || !price || !name || !description) {
      setLocalError("Please fill all fields")
      return
    }

    try {
      setLocalError('')
      const metadata = { image, name, description }
      const result = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, pinataAuth)
      await mintThenList(result.data)
    } catch (error) {
      console.error("NFT creation error: ", error)
      setLocalError('Failed to create NFT. Please check your wallet and try again.')
      if (error.code === 4001) {
        setLocalError('Transaction was rejected in MetaMask.')
      } else if (error.code === -32603) {
        setLocalError('Insufficient funds to complete the transaction.')
      }
    }
  }

  const mintThenList = async (metadata) => {
    try {
      const uri = `https://gateway.pinata.cloud/ipfs/${metadata.IpfsHash}`
      // Mint NFT 
      const mintTx = await nft.mint(uri)
      await mintTx.wait()
      
      // Get tokenId of new NFT
      const id = await nft.tokenCount()
      
      // Approve marketplace to spend NFT
      const approveTx = await nft.setApprovalForAll(marketplace.address, true)
      await approveTx.wait()
      
      // Add NFT to marketplace
      const listingPrice = ethers.utils.parseEther(price.toString())
      const listTx = await marketplace.makeItem(nft.address, id, listingPrice)
      await listTx.wait()
    } catch (error) {
      console.error("Minting error: ", error)
      if (error.code === 4001) {
        setLocalError('Transaction was rejected in MetaMask.')
      } else if (error.code === -32603) {
        setLocalError('Insufficient funds to complete the transaction.')
      } else {
        setLocalError('Failed to mint and list NFT. Please try again.')
      }
      throw error // Re-throw to be caught by createNFT's catch block
    }
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            {localError && (
              <Alert 
                variant="danger" 
                onClose={() => setLocalError('')} 
                dismissible
                className="mb-4"
              >
                {localError}
              </Alert>
            )}
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
                disabled={uploading}
              />
              {image && (
                <div className="text-center">
                  <img className="rounded mt-4" width="350" src={image} alt="NFT Preview"/>
                </div>
              )}
              <Form.Control 
                onChange={(e) => setName(e.target.value)} 
                size="lg" 
                required 
                type="text" 
                placeholder="Name" 
              />
              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                size="lg"
                required
                as="textarea"
                placeholder="Description"
              />
              <Form.Control
                onChange={(e) => setPrice(e.target.value)}
                size="lg"
                required
                type="number"
                placeholder="Price in ETH"
              />
              <div className="d-grid px-0">
                <Button
                  onClick={createNFT}
                  variant="primary"
                  size="lg"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Create & List NFT"}
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create