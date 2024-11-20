import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import Navigation from './Navbar';
import Home from './Home.js'
import Create from './Create.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'
import MarketplaceAbi from '../contractsData/Marketplace.json'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'
import { useState } from 'react'
import { ethers } from "ethers"
import { Spinner } from 'react-bootstrap'
import { Alert } from 'react-bootstrap'

import './App.css';

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState({})
  const [marketplace, setMarketplace] = useState({})
  const [userRole, setUserRole] = useState('')
  const [error, setError] = useState('')

  // Function to determine user role based on account address
  const determineUserRole = (address) => {
    // Example mapping of addresses to roles - replace with your actual addresses
    const roles = {
      "0x123...": "Manager",
      "0x456...": "Buyer1",
      "0x789...": "Buyer2",
      // Add more mappings as needed
    }
    return roles[address] || "User"
  }

  // MetaMask Login/Connect
  const web3Handler = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = accounts[0]
      setAccount(currentAccount)
      
      // Set user role based on account
      const role = determineUserRole(currentAccount)
      setUserRole(role)
      
      // Get provider from Metamask
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      // Set signer
      const signer = provider.getSigner()

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      })

      window.ethereum.on('accountsChanged', async function (accounts) {
        const newAccount = accounts[0]
        setAccount(newAccount)
        setUserRole(determineUserRole(newAccount))
        await web3Handler()
      })
      
      await loadContracts(signer)
    } catch (error) {
      setError('Failed to connect to MetaMask. Please make sure MetaMask is installed and unlocked.')
      console.error('Web3 Handler Error:', error)
    }
  }

  const loadContracts = async (signer) => {
    try {
      // Get deployed copies of contracts
      const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
      setMarketplace(marketplace)
      const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
      setNFT(nft)
      setLoading(false)
    } catch (error) {
      setError('Failed to load contracts. Please check your network connection.')
      console.error('Contract Loading Error:', error)
    }
  }

  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navigation web3Handler={web3Handler} account={account} />
          {/* Display current user role */}
          {userRole && (
            <div className="user-role-banner" style={{ 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              textAlign: 'center',
              borderBottom: '1px solid #dee2e6'
            }}>
              Current User: <strong>{userRole}</strong>
            </div>
          )}
          {/* Error Alert */}
          {error && (
            <Alert 
              variant="danger" 
              onClose={() => setError('')} 
              dismissible
              style={{
                margin: '20px',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              {error}
            </Alert>
          )}
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home marketplace={marketplace} nft={nft} setError={setError} />
              } />
              <Route path="/create" element={
                <Create marketplace={marketplace} nft={nft} setError={setError} />
              } />
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account} setError={setError} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} nft={nft} account={account} setError={setError} />
              } />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;