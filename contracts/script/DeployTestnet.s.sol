// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {BountyBoard} from "../src/BountyBoard.sol";
import {MockAgentID} from "../test/mocks/MockAgentID.sol";
import {MockUSDC} from "../test/mocks/MockUSDC.sol";

/// @notice Deploys mock USDC, a mock Agent ID collection and the board to BSC testnet, where the
///         real Agent ID contract does not exist. Issues an Agent ID and test USDC to the deployer.
/// @dev forge script script/DeployTestnet.s.sol --rpc-url bsc_testnet --broadcast
contract DeployTestnet is Script {
    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;

        MockUSDC usdc = new MockUSDC();
        MockAgentID ids = new MockAgentID();
        BountyBoard board = new BountyBoard(usdc, ids, 100e18, deployer);

        ids.issue(deployer);
        usdc.mint(deployer, 1_000e18);
        vm.stopBroadcast();

        console2.log("MockUSDC   ", address(usdc));
        console2.log("MockAgentID", address(ids));
        console2.log("BountyBoard", address(board));
    }
}
