import { ethers } from "hardhat";
import wyvern from "../wyvernProtocol.json";
import { WyvernProtocol } from "../types-abi";

const readOS = async () => {
  const signers = await ethers.getSigners();
  const osAddress = "0x7f268357a8c2552623316e2562d90e642bb538e5";
  const wyvernExchange = new ethers.Contract(
    osAddress,
    wyvern.abi,
    signers[0]
  ) as WyvernProtocol;
  const codename = await wyvernExchange.codename();
  console.log(codename); //should be "Bulk Smash"

  const diffContract = wyvernExchange.connect(signers[1]);
};

readOS().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
