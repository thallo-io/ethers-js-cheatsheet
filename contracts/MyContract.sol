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