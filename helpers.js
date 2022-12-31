/// Note: poolContract => IUniswapV3Pool

exports.getPoolImmutables = async (poolContract) => {
    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(), // SPCoin
      poolContract.token1(), // WETH
      poolContract.fee()
    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee
    }
    return immutables
  }
  
  exports.getPoolState = async (poolContract) => {
    const slot = poolContract.slot0()
  
    const state = {
      sqrtPriceX96: slot[0]
    }
  
    return state
  }