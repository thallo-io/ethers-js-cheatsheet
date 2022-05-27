![thallo logo](thallo_logo_text_grey_background.png)

[Tomorrow’s carbon market. Powered by blockchain.](https://thallo.io)

# Ethers JS Supplementary Examples

This document is supplementary to the official [ethers docs](https://docs.ethers.io/v5/). I am not a contributor to ethers and am not affiliated with the project other than being an avid user. This document is primarily examples and tips/tricks I've found from my experience with the library. It does not cover all the functionality of ethers. It also will not necessarily explain in detail how the library works or why something works the way it does. These are meant to be pragmatic/empirical examples. This document is meant for developers who are interacting with a network through NodeJS scripts. It is **not** meant for developing web3 frontends, although a lot of functionality may translate.

If you have suggestions for improvement, addition, or find any flaws in this document, please let me know :)

> **Note**: A lot of these examples make use of ethers integration with hardhat via the plugin @nomiclabs/hardhat-ethers. I also prefer to use [typechain](https://github.com/dethcrypto/TypeChain). Where external libraries or plugins are used, I will make note and show the installation and import statements/dependencies.

## Providers & Signers

Primarily, I use providers and signers to connect to and interact with deployed contracts. You can also use them to fetch data from the blockchain like balances, transaction counts, and information about a block, but I won't be covering that. You can find examples of that in the official ethers docs. I will primarily just be showing how to create providers and signers.

#### Providers

I like to think of a Provider as a read-only connection to a network or blockchain.

Ethers provides many different Provider options. Since I mostly interact with the network through NodeJS scripts, I prefer to use the **StaticJsonRpcProvider**. The regular JsonRpcProvider object continuously queries the endpoint with a _getNetwork_ call. This is unncessary if you are passing in an endpoint and always working programatically/through scripts on the same network.

```ts
import { ethers } from "ethers";
const prov = new ethers.providers.StaticJsonRpcProvider("your-endpoint-here");
```

You can pass any valid RPC endpoint url into the provider. There are many different RPC provider services like Infura, Alchemy, Quiknode, Pocket, Ankr, etc.

#### Signers

A Signer can do everything a Provider can do PLUS it can write to the network and change the state of the blockchain, sign messages and transactions. A signer object has either direct or indirect access to a private key for an account.

Usually, the signer(s) are either set up via the hardhat configuration file (if using hardhat) or created using the ethers Wallet object from a private key.

##### Using Hardhat:

You will need the @nomiclabs/hardhat-ethers plugin. You can install from yarn/npm.

Inside hardhat.config.ts:

```ts
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

const RINKEBY_ENDPOINT = process.env.RINKEBY_ENDPOINT;
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  defaultNetwork: "rinkeby",
  networks: {
    rinkeby: {
      url: RINKEBY_ENDPOINT,
      accounts: [PRIVATE_KEY],
    },
  },
};
```

Then, in your script:

```ts
import { ethers } from "hardhat";
const [mySigner] = await ethers.getSigners();
```

getSigners() returns an array of signers. You can add multiple private keys in the hardhat config file. The default hardhat network returns multiple accounts. See hardhat docs for details.

##### Using the Wallet object:

```ts
import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

const prov = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.PRIVATE_KEY || "0x";
const wallet = new ethers.Wallet(ethers.utils.hexlify(privateKey), prov);
```

Note the use of hexlify. Ethers requires all hex strings to be 0x prefixed. Depending on how you are storing your private key in your env file, you may or may not need this. See the github [issue](https://github.com/ethers-io/ethers.js/issues/1166).

You can also create random wallets (useful for testing), or a wallet from a mnemonic.

Random Wallet:

```ts
const randomWallet = ethers.Wallet.createRandom();
```

## Working with Contracts

### Deploying a Contract

With typechain and hardhat:

```ts
import { ethers } from "hardhat";
import { MyContract__factory } from "../typechain";

const deploy = async () => {
  const [owner] = await ethers.getSigners();
  const factory = new MyContract__factory(owner);
  const contract = await factory.deploy();
  await contract.deployed();
};

deploy().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

Without typechain, regular javascript:

```js
const { ethers } = require("hardhat");

const deploy = async () => {
  const factory = await ethers.getContractFactory("MyContract");
  const contract = await factory.deploy();
  await contract.deployed();
};

deploy().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

The import paths and names will vary based on your typechain settings. The name of the factory is based on the actual name of the contract. You can always look at what typechain produces in the typechain folder.

If the contract takes arguments in the constructor, pass them directly in the deploy function of the factory.

### Connecting to an Already Deployed Contract

To create a contract object in ethers you need 3 things:

1. The address of the deployed contract
2. The ABI or interface of the contract
3. A signer or provider

There a few different ways to get the ABI:

- If the contract is verified, go to etherscan and copy it from the contract code tab. I usually add {'abi': ... } to match the formatting from the artifacts import.
- If you've written and compiled the contract yourself, it will likely be in a folder called 'artifacts' and you can directly import the json into your script
- You can write what is known as a "human readable abi" with function signatures in an array. Example below.

With hardhat (typescript), importing the abi from artifacts:

```ts
import { ethers } from "hardhat";
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json";

const execute = async () => {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = new ethers.Contract(contractAddress, MyContract.abi, owner);
  const result = await contract.myViewFunction();
  console.log(result);
};

execute().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

Copying the abi from etherscan, let's use the OpenSea WyvernProtocol as an example. See the contract [here](https://etherscan.io/address/0x7f268357a8c2552623316e2562d90e642bb538e5#code).

> Note that you can create a type from an abi json with typechain by running the following:

```shell
npx typechain --target ethers-v5 --out-dir types-abi ./wyvernProtocol.json
```

> I like to generate the types into a different folder than the types generated by hardhat so the export/index file does not get overwritten.

We would run the below in hardhat with

```shell
npx hardhat run scripts/readOs.ts --network mainnet
```

where mainnet is a network configuration in hardhat.config.ts.

```ts
import { ethers } from "hardhat";
import wyvern from "../wyvernProtocol.json";
import { WyvernProtocol } from "../typechain";

const readOS = async () => {
  const [owner] = await ethers.getSigners();
  const osAddress = "0x7f268357a8c2552623316e2562d90e642bb538e5";
  const wyvernExchange = new ethers.Contract(
    osAddress,
    wyvern.abi,
    owner
  ) as WyvernProtocol;
  const codename = await wyvernExchange.codename();
  console.log(codename); //should be "Bulk Smash"
};

readOS().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

Human Readable ABI:

Example: I am monitoring the Curve [3Pool](https://etherscan.io/address/0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7#readContract) and I want to know how many LP tokens I will receive back for a deposit of 100 USDC.

Instead of copying and importing the whole ABI from etherscan, I can write a single line "human readable" ABI to accomplish what I need.

```ts
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
```

Similar to the OpenSea example, we would run the above on the "mainnet" config from hardhat.

```ts
npx hardhat run scripts/readCurve.ts --network mainnet
```

### Interacting with a Contract

As seen above, calling a method on a created contract instance is extremely easy, it is just the name of the contract object dot whatever the method name is and any arguments passed to that method.

The Contract type in ethers also has a few nice properties that can provide information:

```ts
contract.address;
contract.interface;
contract.provider;
contract.signer;
```

#### Basic Examples

Read only function:

```ts
import { ethers } from "hardhat";
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json";

const execute = async () => {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = new ethers.Contract(contractAddress, MyContract.abi, owner);
  const result = await contract.myViewFunction();
  console.log(result);
};

execute().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

State changing function:

```ts
import { ethers } from "hardhat";
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json";

const execute = async () => {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = new ethers.Contract(contractAddress, MyContract.abi, owner);

  //Assume myFunction changes value of myViewFunction's result
  const funcTx = await contract.myFunction();
  await funcTx.wait();

  const result = await contract.myViewFunction();
  console.log(result);
};

execute().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

The wait method is explained below in the section about transaction responses and receipts.

#### Switching between Signers

Switching signers that are interacting with the contract is extremely useful, especially when doing permissions or role based testing on your contracts. Switching signers is as easy as:

```ts
myContract.connect(signers[1]).myFunction(); //call myFunction with signers[1]
myContract.connect(signers[2]).myFunction(); //call myFunction with signers[2]
```

The original myContract will still be connected to the original signer. However, connect does return a new contract instance connected to the new signer, so you can create new contract instances with assignment.

```ts
const newContractInstance = myContract.connect(signers[1]);
```

#### Transaction Responses and Receipts

I find there are two main points of confusion when people first use ethers to conduct state changing transactions on the blockchain.

1. When you call a transaction that changes the state of the blockchain (i.e. anything but a view or pure function) that also returns a value, you WILL NOT receive the return value of the smart contract function back in ethers. You will receive a [transaction response](https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse) object. This is because the transaction has not been mined yet.

2. If your future logic relies on the new state of the blockchain, you must wait for the transaction to be mined. You can do this by using await txResponse.wait(). The wait() method will return a [transaction receipt](https://docs.ethers.io/v5/api/providers/types/#providers-TransactionReceipt). The transaction receipt contains some useful information about the transaction like gasUsed, effectiveGasPrice, etc. To read information about a changed value, you must use a separate read call after the transaction has been mined, or you can emit an event and retrieve the event information within the transaction receipt. See a discussion about this on [stack exchange](https://ethereum.stackexchange.com/questions/88119/i-see-no-way-to-obtain-the-return-value-of-a-non-view-function-ethers-js). You can also simulate the transaction and get the return value from on the on-chain function using callStatic (discussed in detail with example below).

> Note: the wait function accepts an optional parameter which is the number of blocks to wait. The default is 1. If you want to wait for probablistic finality you can pass in a higher number of blocks to wait.

Example:

```ts

//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

// DO NOT USE THIS IN PRODUCTION, THIS IS JUST RANDOM EXAMPLE CODE

contract MyContract {

    uint256 public myVar;
    address public lastSender;

    event MyEvent(address sender, uint256 value);

    constructor() {
        myVar = 1;
        lastSender = msg.sender;
    }

    function myFunction() external payable {
        myVar++;
        lastSender = msg.sender;
        emit MyEvent(msg.sender, myVar);
    }

    function myViewFunction() external view returns (uint256) {
        return myVar;
    }

    function withdraw() external {
        (bool success, ) = msg.sender.call{value:address(this).balance}("");
        require(success, "send failed");
    }

}
```

Hardhat Script:

```ts
import { ethers } from "hardhat";
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json";

const execute = async () => {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = new ethers.Contract(contractAddress, MyContract.abi, owner);

  //Assume myFunction changes value of myViewFunction's result
  const funcTx = await contract.myFunction();
  await funcTx.wait();

  const result = await contract.myViewFunction();
  console.log(result);
};

execute();
```

#### CallStatic

Ethers provides a very useful way to simulate the result of transactions on-chain with callStatic.

Certain Defi protocols such as Uniswap and Balancer provide quoting functions in smart contracts that are not view functions. Instead, the functions revert and return a value. Trying to call these directly as a write function will waste your hard earned money and not get you what you are looking for. Instead, you can call the function with callStatic and receive the return value (quote) you desire.

See the UniswapV3 quoter [here](https://etherscan.io/address/0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6#code). If you look at the transactions tab, you can see a couple folks accidentally calling the quoter functions directly on accident!

Below is a full example of how to get a quote from the UniswapV3 quoter for swapping from ETH to DAI using callStatic.

```ts
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
```

Again, execute the above with

```
npx hardhat run scripts/uniswapQuote.ts --network mainnet
```

#### Overrides

Ethers provides an easy way to override the default gas price, gas limit, and to send value (ETH or native currency) in a contract call. Note the method must be payable to send value on the method call.

For EIP-1559 enabled chains such as eth mainnet, you can override the maxFeePerGas and maxPriorityFeePerGas. For legacy transactions, you can override the gasPrice.

You can retrieve the current estimated maxFeePerGas and maxPriorityFeePerGas from the network using:

```ts
const feeData = await signer.getFeeData();
```

Example using overrides:

```ts
import { ethers } from "hardhat";
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json";

const example = async () => {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = new ethers.Contract(contractAddress, MyContract.abi, owner);

  //Legacy transaction with overrides
  const funcTx = await contract.myFunction({
    gasLimit: 1_000_000,
    gasPrice: ethers.utils.parseUnits("100", "gwei"),
    value: ethers.utils.parseEther("1"),
  });
  await funcTx.wait();

  const feeData = await account.getFeeData();
  console.log(feeData);

  //EIP 1559 transaction with overrides
  const tx = await contract.myFunction({
    value: ethers.utils.parseEther("1"),
    gasLimit: 200_000,
    maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
    maxPriorityFeePerGas: ethers.utils.parseUnits("3", "gwei"),
  });
  const receipt = await tx.wait();

  const result = await contract.myViewFunction();
  console.log(result);
};

example();
```

#### Encoding calldata

Functions sometimes receive raw calldata (bytes) as an input to forward calls. The [Uniswap](https://etherscan.io/address/0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45) router's multicall function is a perfect example of this. The multicall function allows a user to call multiple functions on the router atomically in one call.

Another example of where this might come in useful is in cross-chain messaging systems such as [LayerZero](https://layerzero.gitbook.io/docs/guides/master/receive-messages). The lzReceive function takes in an arbitrary payload (bytes). You can encode function calls and send these along as a payload to be received and executed by an implemented lzReceive function.

This is possible to code in ethers with the **interface** object that is created for each created contract. The **interface** object allows you to encode function calls easily with the encodeFunctionCall method.

A full working example is shown below using a uniswap multicall to swap a certain amount of ETH/WETH to 5000 DAI, and then refund the unused ETH.

> Note: My slippage settings are arbitrary and probably not best practice. I run this on a forked mainnet to test it. In a production setting I would be much more intentional about finding good slippage settings with a quote, etc.

```ts
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
```

#### Dealing with Events

Ethers provides great tools for listening and querying for past events emitted on-chain.

First, create a filter on the contract and the event name. If the event has parameters, you can set parameters on the filter such as which address the transfer was to or from, what tokenId was transferred in the case of NFTs, etc.

```ts
const filter = contract.filters.MyEvent();
```

Then, you can use the queryFilter method on the contract, passing in the created filter and the block range you want to query. For block ranges, you can specify a start block and an endblock, you can pass in the latest X blocks using -X, or you can pass in the latest X blocks from a given starting block.

```ts
const events = await contract.queryFilter(filter, 14841742, "latest");
const events2 = await contract.queryFilter(filter, -100);
const events3 = await contract.queryFilter(filter, -100, 14841742);
```

Let's look at a full working example of querying for transfers on Bored Ape Yacht Club:

```ts
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
```

You can also create listeners in ethers that take in the event as it happens with the parameters.

```ts
bayc.on(transferFilter, (from, to, tokenId) => {
  console.log(from, to, tokenId);
});

bayc.on(transferTokenId10, (from, to, tokenId) => {
  console.log(from, to);
});
```

#### Sending a Raw Transaction from a Signer

You can always construct and send a transaction with a signer from ethers. Both EIP 1559 and legacy transaction examples are shown below.

Certain fields such as the nonce are optional. See the ethers documentation for more details if you need fine grained control.

```ts
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
```

## Utilities and Constants

My favorite part about the ethers library is it provides so many great formatting utilities, cryptography functions, and useful constants built into the library.

### BigNumber

You will use BigNumber a lot working with ethers. When you query the blockchain for data, many of the values returned will be a BigNumber. Account and token balances, counters, etc.

The [ethers documentation](https://docs.ethers.io/v5/api/utils/bignumber/) on BigNumber is quite good and I suggest reading it.

### parseUnits, parseEther, formatUnits, formatEther

Create a BigNumber from an amount of eth as a string. The final result is in wei.:

```ts
const fiveEther = ethers.utils.parseEther("5");
```

Create a BigNumber with 10^9 units ('gwei'):

```ts
const fiveGwei = ethers.utils.parseUnits("5", "gwei");
```

Create a BigNumber with 10^6 units, for example 500 USDC (has 6 decimals):

```ts
const fiveHundredUSDC = ethers.utils.parseUnits("500", 6);
```

Parsing units from a BigNumber amount in wei. This is really useful for printing values to the console in a readable format or if you are creating a front end to display data to a user.

```ts
console.log(ethers.utils.formatEther(fiveEther));
console.log(ethers.utils.formatUnits(fiveGwei, "gwei"));
console.log(ethers.utils.formatUnits(fiveHundredUSDC, 6));
```

#### Bitmap Example

A bitmap is a data structure that allows storing boolean flags as bits of a single number. For example, 01010001 means that the seventh, fifth, and first entry are true and the rest are false (most significant bit on the left in this example). For example with a uint256 (256 bit number), you can store 256 booleans on a single parameter.

My implementation of a bitmap working with BigNumber in ethers is shown below. (Warning: I have not extensively tested this code and it may contain a bug. If it does, please reach out!)

```ts
import { ethers } from "ethers";

const setIndex = (index: number, num: ethers.BigNumber) => {
  const mask = ethers.BigNumber.from(1).shl(index & 0xff);
  return num.or(mask);
};

const getIndex = (index: number, num: ethers.BigNumber) => {
  const mask = ethers.BigNumber.from(1).shl(index & 0xff);
  return !num.and(mask).eq(0);
};

const unsetIndex = (index: number, num: ethers.BigNumber) => {
  if (!getIndex(index, num)) {
    return num;
  }
  const mask = ethers.BigNumber.from(1).shl(index & 0xff);
  return num.xor(mask);
};

let testNum = ethers.BigNumber.from(0);
testNum = setIndex(5, testNum);
console.log(testNum.toHexString());
testNum = setIndex(4, testNum);
console.log(testNum.toHexString());
console.log(getIndex(5, testNum));
console.log(getIndex(4, testNum));
console.log(getIndex(1, testNum));
testNum = unsetIndex(1, testNum);
console.log(testNum.toHexString());
testNum = unsetIndex(5, testNum);
console.log(testNum.toHexString());
console.log(getIndex(5, testNum));
console.log(getIndex(4, testNum));
console.log(getIndex(1, testNum));
```

### Useful Constants

[ethers documentation](https://docs.ethers.io/v5/api/utils/constants/)

```ts
import { ethers } from "ethers";

ethers.constants.AddressZero;
ethers.constants.HashZero;
ethers.constants.MaxUint256; //useful for approvals
```

### Cryptography and Randomness

You can create a random BigNumber in ethers with the randomBytes utility. To create a random uint256 (32 bytes):

```ts
import { ethers } from "ethers";
const random = ethers.BigNumber.from(ethers.utils.randomBytes(32));
```

#### Merkle Tree Example

Ethers comes standard with common hashing algorithms like sha256 and keccak256. Creating a merkle tree for a whitelist or verifying information has become fairly common in the blockchain space. I won't go over the on-chain Merkle verifier, but this is how you can use ethers to construct your merkle root off-chain.

The example also makes use of the [merkletreejs](https://github.com/miguelmota/merkletreejs) library.

```ts
import { ethers } from "ethers";
import { keccak256, solidityKeccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";

const merkle = () => {
  //Pretend this is a list of 20 byte EVM addresses for our airdrop, etc.
  const whitelistAddresses = ["0x...", "0x...", "0x..."];

  const leaves = whiteListAddresses.map((address) => {
    solidityKeccak256(["address"], [address]);
  });

  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  const root = tree.getHexRoot();
  console.log(root);
};

merkle();
```

Hope you have found this helpful. Ethers JS is a very powerful library and there is always much more to learn. If there are special requests, or as I discover new and wonderful things, I will add to this document!
