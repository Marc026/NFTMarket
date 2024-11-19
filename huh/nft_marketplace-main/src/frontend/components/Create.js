import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import axios from 'axios'

// Pinata configuration (replace with your actual keys)
const pinataApiKey = 'c8974ade8a91d87a55ac';  // Replace with your Pinata API key
const pinataSecretApiKey = 'bd362ea72c991e4d9139cd69a2b4dd8de26c92c2d3a16d3404b68033734cdc8e';  // Replace with your Pinata secret API key

// Pinata authentication headers
const pinataAuth = {
  headers: {
    'pinata_api_key': pinataApiKey,
    'pinata_secret_api_key': pinataSecretApiKey,
  }
};

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        setUploading(true)
        
        // Prepare form data to upload to Pinata
        const formData = new FormData()
        formData.append('file', file)

        // Upload file to Pinata
        const result = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, pinataAuth)
        console.log('Pinata IPFS Result:', result.data)
        
        // Set the image URL from Pinata's IPFS gateway
        setImage(`https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`)
        setUploading(false)
      } catch (error) {
        console.error("Pinata image upload error: ", error)
        setUploading(false)
      }
    }
  }

  const createNFT = async () => {
    if (!image || !price || !name || !description) {
      return alert("Please fill all fields")
    }

    try {
      // Add metadata to IPFS
      const metadata = { image, name, description }
      const result = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, pinataAuth)
      console.log('Pinata Metadata Result:', result.data)
      mintThenList(result.data)
    } catch (error) {
      console.error("Pinata metadata upload error: ", error)
    }
  }

  const mintThenList = async (metadata) => {
    const uri = `https://gateway.pinata.cloud/ipfs/${metadata.IpfsHash}`
    // Mint NFT 
    await (await nft.mint(uri)).wait()
    // Get tokenId of new NFT
    const id = await nft.tokenCount()
    // Approve marketplace to spend NFT
    await (await nft.setApprovalForAll(marketplace.address, true)).wait()
    // Add NFT to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await (await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
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
