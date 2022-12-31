const { ethers } = require('ethers')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState } = require('./helpers')
const ERC20ABI = require('./abi.json')

require('dotenv').config()
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const POOL_ADDRESS = process.env.POOL_ADDRESS
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS
const SPCOIN_ADDRESS = process.env.SPCOIN_ADDRESS
const WETH_ADDRESS = process.env.WETH_ADDRESS

const dumpEnv = () => {
  console.log("INFURA_URL_TESTNET  => " + INFURA_URL_TESTNET)
  console.log("WALLET_ADDRESS      => " + WALLET_ADDRESS)
  console.log("WALLET_SECRET       => " + WALLET_SECRET)
  console.log("SWAP_ROUTER_ADDRESS => " + SWAP_ROUTER_ADDRESS)
  console.log("POOL ADDRESS        => " + POOL_ADDRESS)
  console.log("SPCOIN ADDRESS      => " + SPCOIN_ADDRESS)
  console.log("WETH ADDRESS        => " + WETH_ADDRESS)
}
dumpEnv()

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET) // Goerli
//const poolAddress = "0x4D7C363DED4B3b4e1F954494d2Bc3955e49699cC" 
const poolAddress = '0xDEc8F1bD1707aa654a34ab272D50160B5Aa442Bf' // spCoin/WETH

const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

const name0 = 'Wrapped Ether'
const WETH_Symbol0 = 'WETH'
const decimals0 = 18
const WETH_Address0 = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

/*
const spCoinName = 'Sponsor Coin'
const spCoinSymbol = 'SPCoin'
const spCoinAddress = '0x3Cb3d2655dB27d0ef62f0B77E0e13c06630317Ef'
*/

const name1 = 'Sponsor Coin'
const symbol1 = 'SPCoin'
const decimals1 = 18
const address1 = '0x3Cb3d2655dB27d0ef62f0B77E0e13c06630317Ef'

async function main() {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  )
  console.log("POOL CONTRACT CONTRACT TOKEN 0 (spCoin) =>" + await poolContract.token0())
  console.log("POOL CONTRACT CONTRACT TOKEN 1 (WETH)   =>" + await poolContract.token1())
  // console.log("POOL CONTRACT CONTRACT =>")
  // console.log(poolContract)

  const immutables = await getPoolImmutables(poolContract)
  const state = await getPoolState(poolContract)

  const wallet = new ethers.Wallet(WALLET_SECRET)
  const connectedWallet = wallet.connect(provider)

  const swapRouterContract = new ethers.Contract(
    swapRouterAddress,
    SwapRouterABI,
    provider
  )

  // console.log("SWAP ROUTER CONTRACT =>")
  // console.log(swapRouterContract)

  const inputAmount = 0.001
  // .001 => 1 000 000 000 000 000 WEI
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    decimals0
  )

  const approvalAmount = (amountIn * 100000).toString()
  const tokenContract0 = new ethers.Contract( // WETH Contract
    WETH_Address0,
    ERC20ABI,
    provider
  )
  
  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    approvalAmount
  )

  console.log("APPROVE SWAP ROUTER REQUEST =>")
  console.log(approvalResponse)
  await approvalResponse.wait().then (result => {
            console.log("APPROVAL SUCCESS => ")
            console.log(result)
          }).catch(err => {
            console.log("APPROVAL ERROR => ")
            console.log(err)
          });
     

  const params = {
    tokenIn: immutables.token1, //WETH
    tokenOut: immutables.token0, //spCoin
    fee: immutables.fee,
    recipient: WALLET_ADDRESS, // Etherium Wallet Address
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  console.log("swapRouterContract params => " + JSON.stringify(params,null,"   "))

  const transaction = swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(1000000)
    }
  ).then(transaction => {
    processTransaction(transaction)
  })
  
  processTransaction = (tx) => {
    console.log("TRANSACTION => ")
    console.log(tx)
    tx.wait().then (result => {
//        console.log("SUCCESS => " + JSON.stringify(result, null, "   "))
        console.log("SUCCESS => ")
        console.log(result)
      }).catch(err => {
        console.log("ERROR => ")
        console.log(err)
      });
  }

}

main()