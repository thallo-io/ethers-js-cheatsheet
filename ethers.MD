![thallo logo](thallo_logo_text_grey_background.png)

[Tomorrow’s carbon market. Powered by blockchain.](https://thallo.io)

# Ethers JS Supplementary Examples

This document is supplementary to the official [ethers docs](https://docs.ethers.io/v5/). I am not a contributor to ethers and am not affiliated with the project other than being an avid user. This document is primarily examples and tips/tricks I've found from my experience with the library. It does not cover all the functionality of ethers. It also will not necessarily explain in detail how the library works or why something works the way it does. These are meant to be pragmatic/empirical examples. This document is meant for developers who are interacting with a network through NodeJS scripts. It is **not** meant for developing web3 frontends, although some functionality may translate.

If you have suggestions for improvement, addition, or find any flaws in this document, please let me know :)

**Note**: A lot of these examples make use of ethers integration with hardhat via the plugin @nomiclabs/hardhat-ethers. I also prefer to use [typechain](https://github.com/dethcrypto/TypeChain). Where external libraries or plugins are used, I will make note and show the installation and import statements/dependencies.

## Providers & Signers

Primarily, I use providers and signers to connect to and interact with deployed contracts. You can also use them to fetch data from the blockchain like balances, transaction counts, and information about a block, but I won't be covering that. You can find examples of that in the official ethers docs. I will primarily just be showing how to create providers and signers.

#### Providers

I like to think of a Provider as a read-only connection to a network or blockchain.

Ethers provides many different Provider options. Since I mostly interact with the network through NodeJS scripts, I prefer to use the **StaticJsonRpcProvider**. The regular JsonRpcProvider object continuously queries the endpoint with a _getNetwork_ call. This is unncessary if you are passing in an endpoint and always working programatically/through scripts on the same network.

```
import { ethers } from "ethers"
const prov = new ethers.providers.StaticJsonRpcProvider("your-endpoint-here")
```

You can pass any valid RPC endpoint url into the provider. There are many different RPC provider services like Infura, Alchemy, Quiknode, Pocket, Ankr, etc.

#### Signers

A Signer can do everything a Provider can do PLUS it can write to the network and change the state of the blockchain, sign messages and transactions. A signer object has either direct or indirect access to a private key for an account.

Usually, the signer(s) are either set up via the hardhat configuration file (if using hardhat) or created using the ethers Wallet object from a private key.

##### Using Hardhat:

You will need the @nomiclabs/hardhat-ethers plugin. You can install from yarn/npm.

Inside hardhat.config.ts:

```
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"
dotenvConfig({ path: resolve(__dirname, "./.env") })

const RINKEBY_ENDPOINT = process.env.RINKEBY_ENDPOINT
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""

module.exports = {
    defaultNetwork: "rinkeby",
    networks: {
        rinkeby: {
            url: RINKEBY_ENDPOINT,
            accounts: [PRIVATE_KEY]
        }
    }
}
```

Then, in your script:

```
import { ethers } from "hardhat"
const [mySigner] = await ethers.getSigners()
```

getSigners() returns an array of signers. You can add multiple private keys in the hardhat config file. The default hardhat network returns multiple accounts. See hardhat docs for details.

##### Using the Wallet object:

```
import { ethers } from "ethers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"
dotenvConfig({ path: resolve(__dirname, "./.env") })

const prov = new ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL)
const privateKey = process.env.PRIVATE_KEY || "0x"
const wallet = new ethers.Wallet(ethers.utils.hexlify(privateKey), prov)
```

Note the use of hexlify. Ethers requires all hex strings to be 0x prefixed. Depending on how you are storing your private key in your env file, you may or may not need this. See the github [issue](https://github.com/ethers-io/ethers.js/issues/1166).

You can also create random wallets (useful for testing), or a wallet from a mnemonic.

Random Wallet:

```
const randomWallet = ethers.Wallet.createRandom()
```

## Working with Contracts

### Deploying a Contract

With typechain and hardhat:

```
import { ethers } from 'hardhat'
import { MyContract__factory } from '../typechain'

const deploy = async () => {
    const [owner] = await ethers.getSigners()
    const factory = new MyContract__factory(owner)
    const contract = await factory.deploy()
    await contract.deployed()
}

deploy().catch (e => {
    console.error(e)
    process.exitCode = 1
})
```

Without typechain, regular javascript:

```
const { ethers } = require ('hardhat')

const deploy = async () => {
    const factory = await ethers.getContractFactory('MyContract')
    const contract = await factory.deploy()
    await contract.deployed()
}

deploy().catch (e => {
    console.error(e)
    process.exitCode = 1
})
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

```
import { ethers } from 'hardhat'
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json"

const execute = async () => {
    const [owner] = await ethers.getSigners()
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const contract = new ethers.Contract(
        contractAddress,
        MyContract.abi,
        owner
    )
    const result = await contract.myViewFunction()
    console.log(result)
}

execute().catch (e => {
    console.error(e)
    process.exitCode = 1
})

```

Copying the abi from etherscan, let's use the OpenSea WyvernProtocol as an example. See the contract [here](https://etherscan.io/address/0x7f268357a8c2552623316e2562d90e642bb538e5#code).

We would run the below in hardhat with 'npx hardhat run scripts/readOs.ts --network mainnet' where mainnet is a network configuration in hardhat.config.ts.

```
import { ethers } from 'hardhat'
import WyvernProtocol from '../wyvernProtocol.json'

const readOS = async () => {
    const [owner] = await ethers.getSigners()
    const osAddress = '0x7f268357a8c2552623316e2562d90e642bb538e5'
    const wyvernExchange = new ethers.Contract(
        osAddress,
        WyvernProtocol.abi,
        owner
    )
    const codename = await wyvernExchange.codename()
    console.log(codename) //should be "Bulk Smash"
}

readOS().catch (e => {
    console.error(e)
    process.exitCode = 1
})
```

Human Readable ABI:

Example: I am monitoring the Curve [3Pool](https://etherscan.io/address/0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7#readContract) and I want to know how many LP tokens I will receive back for a deposit of 100 USDC.

Instead of copying and importing the whole ABI from etherscan, I can write a single line "human readable" ABI to accomplish what I need.

```
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

Similar to the OpenSea example, we would run the above on the "mainnet" config from hardhat. "npx hardhat run scripts/readCurve.ts --network mainnet"

### Interacting with a Contract

As seen above, calling a method on a created contract instance is extremely easy, it is just the name of the contract object dot whatever the method name is an any arguments passed to that method.

The Contract type in ethers also has a few nice properties that can provide information:

```
contract.address
contract.interface
contract.provider
contract.signer
```

#### Basic Examples

Read only function:

```
import { ethers } from 'hardhat'
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json"

const execute = async () => {
    const [owner] = await ethers.getSigners()
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const contract = new ethers.Contract(
        contractAddress,
        MyContract.abi,
        owner
    )
    const result = await contract.myViewFunction()
    console.log(result)
}

execute().catch (e => {
    console.error(e)
    process.exitCode = 1
})
```

State changing function:

```
import { ethers } from 'hardhat'
import MyContract from "../artifacts/contracts/MyContract.sol/MyContract.json"

const execute = async () => {
    const [owner] = await ethers.getSigners()
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const contract = new ethers.Contract(
        contractAddress,
        MyContract.abi,
        owner
    )

    //Assume myFunction changes value of myViewFunction's result
    const funcTx = await contract.myFunction()
    await funcTx.wait()

    const result = await contract.myViewFunction()
    console.log(result)
}

execute().catch (e => {
    console.error(e)
    process.exitCode = 1
})
```

The wait method is explained below in the section about transaction responses and receipts.

#### Switching between Signers

Switching signers that are interacting with the contract is extremely useful, especially when doing permissions or role based testing on your contracts. Switching signers is as easy as:

```
myContract.connect(signers[1]).myFunction() //call myFunction with signers[1]
myContract.connect(signers[2]).myFunction() //call myFunction with signers[2]
```

#### Transaction Responses and Receipts

I find there are two main points of confusion when people first use ethers to conduct state changing transactions on the blockchain.

1. When you call a transaction that changes the state of the blockchain (i.e. anything but a view or pure function) that also returns a value, you WILL NOT receive the return value of the smart contract function back in ethers. You will receive a [transaction response](https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse) object. This is because the transaction has not been mined yet.

2. If your future logic relies on the new state of the blockchain, you must wait for the transaction to be mined. You can do this by using await txResponse.wait(). The wait() method will return a [transaction receipt](https://docs.ethers.io/v5/api/providers/types/#providers-TransactionReceipt). The transaction receipt contains some useful information about the transaction like gasUsed, effectiveGasPrice, etc. To read information about a changed value, you must use a separate read call after the transaction has been mined, or you can emit an event and retrieve the event information within the transaction receipt. See a discussion about this on [stack exchange](https://ethereum.stackexchange.com/questions/88119/i-see-no-way-to-obtain-the-return-value-of-a-non-view-function-ethers-js). You can also simulate the transaction and get the return value from on the on-chain function using callStatic (discussed in detail with example below).

Example:

```
Soldity Contract:

Hardhat Script:

```

#### CallStatic

Ethers provides a very useful way to simulate transactions on-chain with callStatic.

Certain Defi protocols such as Uniswap and Balancer provide quoting functions in smart contracts that are not view functions. Instead, the functions revert and return a value. Trying to call these directly as a write function will waste your hard earned money and not get you what you are looking for. Instead, you can call the function with callStatic and receive the return value (quote) you desire.

See the UniswapV3 quoter [here](https://etherscan.io/address/0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6#code). If you look at the transactions tab, you can see a couple folks accidentally calling the quoter functions directly on accident!

Below is a full example of how to get a quote from the UniswapV3 quoter for swapping from WETH/ETH to DAI using callStatic.

```
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

Again, execute the above with "npx hardhat run scripts/uniswapQuote.ts --network mainnet"

#### Overrides

overrides (gaslimit, gasprice, value)

```

```

#### Encoding calldata

encoding data, abiencoder, decoding data
uniswap multicall

```

```

#### Dealing with Events

queryFilter, listening for events, etc.

```

```

#### Sending a Raw Transaction from a Signer

signer send transaction

```

```

## Utilities and Constants

My favorite part about the ethers library is it provides so many great formatting utilities, cryptography functions, and useful constants built into the library.

Useful constants (0 address, MaxUint256, hashZero)

```

```

Utils (solidityKeccak256, keccak256 (Merkle Tree Example), arrayify, randomBytes, parseEther/parseUnits, formatEther/formatUnits)
BitMap math

```

```

```

```

```

```

Hope you have found this helpful. Ethers JS is a very powerful library and there is always much more to learn. If there are special requests, or as I discover new and wonderful things, I will add to this document!
