import { ethers } from "hardhat";

const multicall = async () => {
  const [account] = await ethers.getSigners();
  const uniAddress = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
  const uniABI = [
    "function multicall(uint256 deadline, bytes[] data) payable returns (bytes[])",
    "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMax, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)",
    "function refundETH() payable",
  ];

  const uniContract = new ethers.Contract(uniAddress, uniABI, account);

  const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  const daiABI = ["function balanceOf(address owner) view returns (uint256)"];
  const daiContract = new ethers.Contract(DAI, daiABI, account);

  /* exactOutputSingle:
     address tokenIn,
     address tokenOut,
     uint24 fee,
     address recipient,
     uint256 amountOut,
     uint256 amountInMax,
     sqrtPriceLimitX96,
  */
  const params = [
    WETH9,
    DAI,
    500,
    account.address,
    ethers.utils.parseEther("5000"),
    ethers.utils.parseEther("3"),
    0,
  ];

  const calldataExactOutput = uniContract.interface.encodeFunctionData(
    "exactOutputSingle",
    [params]
  );

  const calldataRefund = uniContract.interface.encodeFunctionData(
    "refundETH",
    []
  );

  const daiBalanceBefore = await daiContract.balanceOf(account.address);
  const ethBalanceBefore = await account.getBalance();
  console.log(
    "DAI Balance Before Swap: ",
    ethers.utils.formatEther(daiBalanceBefore)
  );
  console.log(
    "ETH Balance Before Swap: ",
    ethers.utils.formatEther(ethBalanceBefore)
  );

  const deadline = Math.ceil(Date.now() / 1000) + 60;
  const multicallTx = await uniContract.multicall(
    deadline,
    [calldataExactOutput, calldataRefund],
    { value: ethers.utils.parseEther("3") }
  );

  await multicallTx.wait();

  const daiBalanceAfter = await daiContract.balanceOf(account.address);
  console.log(
    "DAI Balance After Swap: ",
    ethers.utils.formatEther(daiBalanceAfter)
  );

  const ethBalanceAfter = await account.getBalance();
  console.log(
    "ETH Balance After Swap: ",
    ethers.utils.formatEther(ethBalanceAfter)
  );

  // console.log(calldataExactOutput);
  // console.log(calldataRefund);
  // console.log(uniContract.interface.getSighash("exactOutputSingle"));
  // console.log(uniContract.interface.getSighash("refundETH"));
};

multicall();
