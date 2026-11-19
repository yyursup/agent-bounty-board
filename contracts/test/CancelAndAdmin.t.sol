// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

contract CancelAndAdminTest is BaseTest {
    // ---- cancel ---------------------------------------------------------------------------------

    function test_cancel_refundsOpenBountyAnyTime() public {
        uint256 before = usdc.balanceOf(poster);
        uint256 id = _post();

        vm.expectEmit(address(board));
        emit IBountyBoard.BountyRefunded(id, poster, REWARD);
        vm.prank(poster);
        board.cancelBounty(id);

        assertEq(usdc.balanceOf(poster), before);
        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Refunded));
    }

    function test_cancel_refundsClaimedBountyAfterMissedDeadline() public {
        uint256 id = _postAndClaim();
        vm.warp(uint256(board.getBounty(id).deadline) + 1);
        vm.prank(poster);
        board.cancelBounty(id);

        assertEq(usdc.balanceOf(address(board)), 0);
        assertEq(board.recordOf(agent).missedDeadlines, 1);
    }

    function test_cancel_revertsForClaimedBountyBeforeDeadline() public {
        uint256 id = _postAndClaim();
        vm.warp(board.getBounty(id).deadline);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotRefundable.selector, id));
        board.cancelBounty(id);
    }

    function test_cancel_revertsOnceSubmitted() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + 30 days);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotRefundable.selector, id));
        board.cancelBounty(id);
    }

    function test_cancel_revertsTwice() public {
        uint256 id = _post();
        vm.startPrank(poster);
        board.cancelBounty(id);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotRefundable.selector, id));
        board.cancelBounty(id);
        vm.stopPrank();
    }

    function test_cancel_revertsForNonPoster() public {
        uint256 id = _post();
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotPoster.selector, id));
        board.cancelBounty(id);
    }

    function test_cancel_worksWhilePaused() public {
        uint256 id = _post();
        vm.prank(owner);
        board.pause();
        vm.prank(poster);
        board.cancelBounty(id);
        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Refunded));
    }

    // ---- owner ----------------------------------------------------------------------------------

    function test_pause_onlyOwner() public {
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", outsider));
        board.pause();

        vm.startPrank(owner);
        board.pause();
        assertTrue(board.paused());
        board.unpause();
        assertFalse(board.paused());
        vm.stopPrank();
    }

    function test_ownership_transfersInTwoSteps() public {
        address next = makeAddr("next");
        vm.prank(owner);
        board.transferOwnership(next);
        assertEq(board.owner(), owner);

        vm.prank(next);
        board.acceptOwnership();
        assertEq(board.owner(), next);
    }

    // ---- views ----------------------------------------------------------------------------------

    function test_hasAgentId_followsTheCollection() public {
        assertTrue(board.hasAgentId(agent));
        assertFalse(board.hasAgentId(outsider));
        ids.issue(outsider);
        assertTrue(board.hasAgentId(outsider));
    }
}
