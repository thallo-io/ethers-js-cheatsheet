import { ethers } from "hardhat";
import { MyContract__factory } from "../typechain";

const overrides = async () => {
  const [account] = await ethers.getSigners();
  const factory = new MyContract__factory(account);
  const contract = await factory.deploy();
  await contract.deployed();

  const feeData = await account.getFeeData();
  console.log(feeData);

  const tx = await contract.myFunction({
    value: ethers.utils.parseEther("1"),
    gasLimit: 200_000,
    maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: ethers.utils.parseUnits("3", "gwei"),
  });
  const receipt = await tx.wait();

  console.log(receipt);
};

overrides();
