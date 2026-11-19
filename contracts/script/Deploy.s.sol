// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {BountyBoard} from "../src/BountyBoard.sol";
import {IAgentID} from "../src/interfaces/IAgentID.sol";

/// @notice Deploys the board against existing USDC and Agent ID contracts (BNB Chain mainnet).
/// @dev Env: REWARD_TOKEN, AGENT_ID, MAX_REWARD (token units), OWNER.
///      forge script script/Deploy.s.sol --rpc-url bsc --broadcast --verify
contract Deploy is Script {
    function run() external returns (BountyBoard board) {
        IERC20 token = IERC20(vm.envAddress("REWARD_TOKEN"));
        IAgentID ids = IAgentID(vm.envAddress("AGENT_ID"));
        uint96 maxReward = uint96(vm.envUint("MAX_REWARD"));
        address owner = vm.envAddress("OWNER");

        vm.startBroadcast();
        board = new BountyBoard(token, ids, maxReward, owner);
        vm.stopBroadcast();

        console2.log("BountyBoard", address(board));
    }
}
