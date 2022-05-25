import { ethers } from "hardhat";

const callQuote = async () => {
  const uniswapRouter = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
  const [account] = await ethers.getSigners();
  const uniAbi = [
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) public returns (uint256 amountOut)",
  ];
  const uni = new ethers.Contract(uniswapRouter, uniAbi, account);

  const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const fee = 3000;
  const amountIn = ethers.utils.parseEther("1");
  const sqrtPriceLimitX96 = 0;

  const priceQuote = await uni.callStatic.quoteExactInputSingle(
    WETH9,
    DAI,
    fee,
    amountIn,
    sqrtPriceLimitX96
  );

  console.log(ethers.utils.formatEther(priceQuote));
};

callQuote();
