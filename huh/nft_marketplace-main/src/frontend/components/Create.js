import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'

// Updated IPFS configuration
const projectId = 'e75a437ad5e0482ab1e7548babad2878';    // Replace with your Infura project ID
const projectSecret = 'q6HsuO0cNk7YSRyE1HrohBrfNTGWd0mNXhBRT/049TdnrirW2r9fWg';  // Replace with your Infura secret
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

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
        const result = await client.add(
          file,
          {
            progress: (prog) => console.log(`Received: ${prog}`)
          }
        )
        console.log('IPFS Result:', result)
        setImage(`https://ipfs.infura.io/ipfs/${result.path}`)
        setUploading(false)
      } catch (error) {
        console.error("IPFS image upload error: ", error)
        setUploading(false)
      }
    }
  }

  const createNFT = async () => {
    if (!image || !price || !name || !description) {
      return alert("Please fill all fields")
    }

    try {
      const result = await client.add(JSON.stringify({ image, name, description }))
      console.log('Metadata Result:', result)
      mintThenList(result)
    } catch (error) {
      console.error("IPFS uri upload error: ", error)
    }
  }

  const mintThenList = async (result) => {
    const uri = `https://ipfs.infura.io/ipfs/${result.path}`
    // mint nft 
    await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()
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