import { ethers } from "hardhat";
import { MyContract__factory } from "../typechain";

const rawTx = async () => {
  const [account] = await ethers.getSigners();
  const factory = new MyContract__factory(account);
  const contract = await factory.deploy();
  await contract.deployed();

  const tx1559 = {
    to: contract.address,
    data: contract.interface.encodeFunctionData("myFunction"),
    value: ethers.utils.parseEther("1"),
    type: 2,
    maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: ethers.utils.parseUnits("3", "gwei"),
    gasLimit: 35_000,
  };

  const txLegacy = {
    to: contract.address,
    data: contract.interface.encodeFunctionData("myFunction"),
    value: ethers.utils.parseEther("1"),
    gasLimit: 35_000,
    gasPrice: ethers.utils.parseUnits("30", "gwei"),
  };

  const txResponse = await account.sendTransaction(tx1559);
  await txResponse.wait();

  const txReponse2 = await account.sendTransaction(txLegacy);
  await txReponse2.wait();
};

rawTx();
