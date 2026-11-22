// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

/// @notice Free jobs (reward 0): Agent ID on both sides, no money moves, and the ratings are kept
///         apart from paid work so they can't inflate it.
contract FreeJobsTest is BaseTest {
    function _postFree() internal returns (uint256 id) {
        vm.prank(poster);
        id = board.createBounty(0, _deadline(), REVIEW, true, 0, BRIEF);
    }

    function _freeDelivered() internal returns (uint256 id) {
        id = _postFree();
        vm.prank(agent);
        board.claimBounty(id);
        vm.prank(agent);
        board.submitWork(id, RESULT);
    }

    // ---- posting --------------------------------------------------------------------------------

    function test_free_postsWithoutMovingTokens() public {
        uint256 before = usdc.balanceOf(poster);

        vm.expectEmit(address(board));
        emit IBountyBoard.BountyCreated(1, poster, 0, _deadline(), REVIEW, true, 0, BRIEF);
        uint256 id = _postFree();

        assertEq(usdc.balanceOf(poster), before);
        assertEq(usdc.balanceOf(address(board)), 0);
        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(b.reward, 0);
        assertEq(b.floorBps, 0);
        assertTrue(b.agentIdOnly);
    }

    function test_free_needsNoApproval() public {
        address holder = makeAddr("holder");
        ids.issue(holder);
        vm.prank(holder);
        board.createBounty(0, _deadline(), REVIEW, true, 0, BRIEF);
        assertEq(board.bountyCount(), 1);
    }

    function test_free_revertsWhenOpenToAnyWallet() public {
        vm.prank(poster);
        vm.expectRevert(IBountyBoard.FreeJobNeedsAgentId.selector);
        board.createBounty(0, _deadline(), REVIEW, false, 0, BRIEF);
    }

    function test_free_revertsWithAFloor() public {
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidFloor.selector, FLOOR));
        board.createBounty(0, _deadline(), REVIEW, true, FLOOR, BRIEF);
    }

    function test_free_posterNeedsAnAgentId() public {
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotAgentIdHolder.selector, outsider));
        board.createBounty(0, _deadline(), REVIEW, true, 0, BRIEF);
    }

    function test_free_carrierNeedsAnAgentId() public {
        uint256 id = _postFree();
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotAgentIdHolder.selector, outsider));
        board.claimBounty(id);
    }

    function test_free_posterCannotPickUpOwnJob() public {
        uint256 id = _postFree();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.CannotClaimOwnBounty.selector, id));
        board.claimBounty(id);
    }

    // ---- settling -------------------------------------------------------------------------------

    function test_free_settleRecordsTheRatingApartFromPaidWork() public {
        uint256 id = _freeDelivered();

        vm.expectEmit(address(board));
        emit IBountyBoard.WorkSettled(id, agent, 0, 4, 0, 0);
        vm.prank(poster);
        board.settle(id, 0, 4);

        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Paid));
        assertEq(board.getBounty(id).paidBps, 0);

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.freeDone, 1);
        assertEq(r.freeRated, 1);
        assertEq(r.freeRatingSum, 4);
        assertEq(r.paid, 0);
        assertEq(r.rated, 0);
        assertEq(r.ratingSum, 0);
        assertEq(r.paidBpsSum, 0);
        assertEq(r.earned, 0);

        IBountyBoard.PosterRecord memory p = board.posterRecordOf(poster);
        assertEq(p.freeSettled, 1);
        assertEq(p.settled, 0);
        assertEq(p.paidBpsSum, 0);
        assertEq(p.paidOut, 0);
    }

    function test_free_settleRejectsAShare() public {
        uint256 id = _freeDelivered();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidPayout.selector, 10_000, 0));
        board.settle(id, 10_000, 5);
    }

    function test_free_settleStillNeedsARating() public {
        uint256 id = _freeDelivered();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidRating.selector, 0));
        board.settle(id, 0, 0);
    }

    function test_free_releaseAfterTimeoutCountsAsDoneWithoutRating() public {
        uint256 id = _freeDelivered();
        vm.warp(block.timestamp + REVIEW);

        vm.expectEmit(address(board));
        emit IBountyBoard.PaymentReleasedAfterTimeout(id, agent, 0);
        vm.prank(agent);
        board.releaseAfterTimeout(id);

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.freeDone, 1);
        assertEq(r.freeRated, 0);
        assertEq(r.paid, 0);
        assertEq(r.timeoutReleases, 0);
        assertEq(board.getBounty(id).paidBps, 0);
        assertEq(board.posterRecordOf(poster).unanswered, 1);
        assertEq(usdc.balanceOf(address(board)), 0);
    }

    function test_free_cancelRefundsNothingAndCloses() public {
        uint256 id = _postFree();
        uint256 before = usdc.balanceOf(poster);

        vm.expectEmit(address(board));
        emit IBountyBoard.BountyRefunded(id, poster, 0);
        vm.prank(poster);
        board.cancelBounty(id);

        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Refunded));
        assertEq(usdc.balanceOf(poster), before);
    }

    function test_free_alongsidePaidLeavesEscrowExact() public {
        _postFree();
        _post();
        assertEq(usdc.balanceOf(address(board)), REWARD);
    }
}
