// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

import {BountyBoard} from "../../src/BountyBoard.sol";
import {IBountyBoard} from "../../src/interfaces/IBountyBoard.sol";
import {MockAgentID} from "../mocks/MockAgentID.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";

/// @notice Shared fixture: a board, a token, three Agent ID holders and one outsider.
abstract contract BaseTest is Test {
    uint96 internal constant REWARD = 12e18;
    uint96 internal constant MAX_REWARD = 100e18;
    uint32 internal constant REVIEW = 48 hours;
    string internal constant BRIEF = "ipfs://brief";
    string internal constant RESULT = "ipfs://result";

    BountyBoard internal board;
    MockUSDC internal usdc;
    MockAgentID internal ids;

    address internal owner = makeAddr("owner");
    address internal poster = makeAddr("poster");
    address internal agent = makeAddr("agent");
    address internal otherAgent = makeAddr("otherAgent");
    address internal outsider = makeAddr("outsider");

    function setUp() public virtual {
        usdc = new MockUSDC();
        ids = new MockAgentID();
        board = new BountyBoard(usdc, ids, MAX_REWARD, owner);

        ids.issue(poster);
        ids.issue(agent);
        ids.issue(otherAgent);

        usdc.mint(poster, 1_000e18);
        vm.prank(poster);
        usdc.approve(address(board), type(uint256).max);
    }

    // ---- helpers ------------------------------------------------------------------------------

    function _deadline() internal view returns (uint40) {
        return uint40(block.timestamp + 3 days);
    }

    function _post() internal returns (uint256 id) {
        vm.prank(poster);
        id = board.createBounty(REWARD, _deadline(), REVIEW, true, BRIEF);
    }

    function _postAndClaim() internal returns (uint256 id) {
        id = _post();
        vm.prank(agent);
        board.claimBounty(id);
    }

    function _postClaimSubmit() internal returns (uint256 id) {
        id = _postAndClaim();
        vm.prank(agent);
        board.submitWork(id, RESULT);
    }

    function _status(uint256 id) internal view returns (IBountyBoard.Status) {
        return board.getBounty(id).status;
    }
}
