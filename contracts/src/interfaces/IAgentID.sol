// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice The slice of the Agent ID contract (SPACE ID, ERC-721, non-transferable) that the board relies on.
/// @dev On BNB Chain mainnet: 0x60b9262456de011f7d15a54cdd8c48baaa8b022f. A balance above zero means the
///      address holds an Agent ID.
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}
