// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

/// @notice Approve, reject and release after timeout: the ways a submission resolves.
contract ReviewTest is BaseTest {
    // ---- approve --------------------------------------------------------------------------------

    function test_approve_paysAgentAndRecordsRating() public {
        uint256 id = _postClaimSubmit();

        vm.expectEmit(address(board));
        emit IBountyBoard.WorkApproved(id, agent, REWARD, 4);
        vm.prank(poster);
        board.approveWork(id, 4);

        assertEq(usdc.balanceOf(agent), REWARD);
        assertEq(usdc.balanceOf(address(board)), 0);
        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Paid));

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.paid, 1);
        assertEq(r.rated, 1);
        assertEq(r.ratingSum, 4);
        assertEq(r.earned, REWARD);
        assertEq(r.timeoutReleases, 0);
    }

    function test_approve_stillAllowedAfterReviewWindow() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW + 1);
        vm.prank(poster);
        board.approveWork(id, 5);
        assertEq(usdc.balanceOf(agent), REWARD);
    }

    function test_approve_revertsOnInvalidRating() public {
        uint256 id = _postClaimSubmit();
        vm.startPrank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidRating.selector, 0));
        board.approveWork(id, 0);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidRating.selector, 6));
        board.approveWork(id, 6);
        vm.stopPrank();
    }

    function test_approve_revertsForNonPoster() public {
        uint256 id = _postClaimSubmit();
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotPoster.selector, id));
        board.approveWork(id, 5);
    }

    function test_approve_revertsBeforeSubmission() public {
        uint256 id = _postAndClaim();
        vm.prank(poster);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Claimed)
        );
        board.approveWork(id, 5);
    }

    function test_approve_cannotPayTwice() public {
        uint256 id = _postClaimSubmit();
        vm.startPrank(poster);
        board.approveWork(id, 5);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Paid)
        );
        board.approveWork(id, 5);
        vm.stopPrank();
    }

    function test_approve_worksWhilePaused() public {
        uint256 id = _postClaimSubmit();
        vm.prank(owner);
        board.pause();
        vm.prank(poster);
        board.approveWork(id, 5);
        assertEq(usdc.balanceOf(agent), REWARD);
    }

    // ---- reject ---------------------------------------------------------------------------------

    function test_reject_reopensAndLogsRejection() public {
        uint256 id = _postClaimSubmit();

        vm.expectEmit(address(board));
        emit IBountyBoard.WorkRejected(id, agent);
        vm.prank(poster);
        board.rejectWork(id);

        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(uint8(b.status), uint8(IBountyBoard.Status.Open));
        assertEq(b.agent, address(0));
        assertEq(b.submittedAt, 0);
        assertEq(b.resultURI, "");
        assertEq(board.recordOf(agent).rejected, 1);
        assertEq(usdc.balanceOf(address(board)), REWARD);

        vm.prank(otherAgent);
        board.claimBounty(id);
        assertEq(board.getBounty(id).agent, otherAgent);
    }

    function test_reject_revertsOnceReviewWindowClosed() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.ReviewWindowClosed.selector, id));
        board.rejectWork(id);
    }

    function test_reject_revertsForNonPoster() public {
        uint256 id = _postClaimSubmit();
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotPoster.selector, id));
        board.rejectWork(id);
    }

    // ---- release after timeout ------------------------------------------------------------------

    function test_release_paysAgentAfterWindow() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW);

        vm.expectEmit(address(board));
        emit IBountyBoard.PaymentReleasedAfterTimeout(id, agent, REWARD);
        vm.prank(agent);
        board.releaseAfterTimeout(id);

        assertEq(usdc.balanceOf(agent), REWARD);
        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Paid));
        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.paid, 1);
        assertEq(r.rated, 0);
        assertEq(r.timeoutReleases, 1);
        assertEq(r.earned, REWARD);
    }

    function test_release_revertsWhileWindowOpen() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW - 1);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.ReviewWindowOpen.selector, id));
        board.releaseAfterTimeout(id);
    }

    function test_release_revertsForSomeoneElse() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotAgent.selector, id));
        board.releaseAfterTimeout(id);
    }

    function test_release_worksWhilePaused() public {
        uint256 id = _postClaimSubmit();
        vm.prank(owner);
        board.pause();
        vm.warp(block.timestamp + REVIEW);
        vm.prank(agent);
        board.releaseAfterTimeout(id);
        assertEq(usdc.balanceOf(agent), REWARD);
    }

    function testFuzz_ratingsAccumulate(uint8 a, uint8 b) public {
        a = uint8(bound(a, 1, 5));
        b = uint8(bound(b, 1, 5));

        uint256 first = _postClaimSubmit();
        vm.prank(poster);
        board.approveWork(first, a);

        uint256 second = _postClaimSubmit();
        vm.prank(poster);
        board.approveWork(second, b);

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.rated, 2);
        assertEq(r.ratingSum, uint32(a) + b);
        assertEq(r.earned, uint128(REWARD) * 2);
    }
}
