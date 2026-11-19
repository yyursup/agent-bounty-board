// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IAgentID} from "../../src/interfaces/IAgentID.sol";

/// @notice Stand-in for the Agent ID collection: one non-transferable ID per address.
contract MockAgentID is IAgentID {
    mapping(address => bool) private _holders;

    function issue(address to) external {
        _holders[to] = true;
    }

    function revoke(address from) external {
        _holders[from] = false;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _holders[owner] ? 1 : 0;
    }
}
