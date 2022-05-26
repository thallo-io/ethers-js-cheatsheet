import { ethers } from "hardhat";

const boredApeTransfers = async () => {
  const baycAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
  const baycABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ];
  const [account] = await ethers.getSigners();
  const bayc = new ethers.Contract(baycAddress, baycABI, account);

  const transferFilter = bayc.filters.Transfer();
  const apesTransferredLast100 = await bayc.queryFilter(transferFilter, -100);

  const transferTokenId10 = bayc.filters.Transfer(null, null, 10);
  const apeTenTransferred = await bayc.queryFilter(transferTokenId10);

  console.log(apesTransferredLast100);
  console.log(apeTenTransferred);
};

boredApeTransfers();
