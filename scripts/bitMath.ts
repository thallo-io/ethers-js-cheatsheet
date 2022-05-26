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
