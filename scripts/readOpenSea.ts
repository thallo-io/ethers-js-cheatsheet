import { ethers } from "hardhat";
import WyvernProtocol from "../wyvernProtocol.json";

const readOS = async () => {
  const [owner] = await ethers.getSigners();
  const osAddress = "0x7f268357a8c2552623316e2562d90e642bb538e5";
  const wyvernExchange = new ethers.Contract(
    osAddress,
    WyvernProtocol.abi,
    owner
  );
  const codename = await wyvernExchange.codename();
  console.log(codename); //should be "Bulk Smash"
};

readOS().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
