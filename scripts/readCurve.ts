import { ethers } from "hardhat";

const readCurve = async () => {
  const curveABI = [
    "function calc_token_amount(uint256[3] _amounts, bool _is_deposit) view returns (uint256)",
  ];
  const curve3Pool = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";
  const [owner] = await ethers.getSigners();
  const curve = new ethers.Contract(curve3Pool, curveABI, owner);

  /*
        USDC is the second token in the order (DAI, USDC, Tether)
        USDC has 6 decimals
        I will review the parseUnits and formatEther utilities in the utilities section
    */

  const LPTokens = await curve.calc_token_amount(
    [0, ethers.utils.parseUnits("100", 6), 0],
    true
  );

  console.log(ethers.utils.formatEther(LPTokens));
};

readCurve().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
