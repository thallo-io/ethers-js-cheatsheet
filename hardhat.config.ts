import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const MAINNET_RPC = process.env.MAINNET_RPC || "";
const ARCHIVE_RPC = process.env.ARCHIVE_RPC || "";

const config = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      timeout: 100_000,
      chainId: 1337,
      accounts: {
        count: 10,
      },
      loggingEnabled: true,
      forking: {
        url: ARCHIVE_RPC,
        blockNumber: 14841742,
      },
    },
    mainnet: {
      url: MAINNET_RPC,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: "0.8.4",
  typechain: {
    outDir: "typechain", //for working ONLY in hardhat
    target: "ethers-v5",
  },
};

export default config;
