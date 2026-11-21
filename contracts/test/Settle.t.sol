// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

/// @notice Settling a delivery by share, and release after timeout: the ways a submission resolves.
contract SettleTest is BaseTest {
    // ---- settle ---------------------------------------------------------------------------------

    function test_settle_fullPaysAgentEverything() public {
        uint256 id = _postClaimSubmit();

        vm.expectEmit(address(board));
        emit IBountyBoard.WorkSettled(id, agent, 10_000, 5, REWARD, 0);
        vm.prank(poster);
        board.settle(id, 10_000, 5);

        assertEq(usdc.balanceOf(agent), REWARD);
        assertEq(usdc.balanceOf(address(board)), 0);
        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(uint8(b.status), uint8(IBountyBoard.Status.Paid));
        assertEq(b.paidBps, 10_000);
    }

    function test_settle_partialSplitsBetweenAgentAndPoster() public {
        uint256 id = _postClaimSubmit();
        uint256 posterBefore = usdc.balanceOf(poster);
        uint96 toAgent = REWARD * 6_000 / 10_000;

        vm.expectEmit(address(board));
        emit IBountyBoard.WorkSettled(id, agent, 6_000, 3, toAgent, REWARD - toAgent);
        vm.prank(poster);
        board.settle(id, 6_000, 3);

        assertEq(usdc.balanceOf(agent), toAgent);
        assertEq(usdc.balanceOf(poster), posterBefore + REWARD - toAgent);
        assertEq(usdc.balanceOf(address(board)), 0);

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.paid, 1);
        assertEq(r.rated, 1);
        assertEq(r.ratingSum, 3);
        assertEq(r.paidBpsSum, 6_000);
        assertEq(r.earned, toAgent);

        IBountyBoard.PosterRecord memory p = board.posterRecordOf(poster);
        assertEq(p.settled, 1);
        assertEq(p.paidBpsSum, 6_000);
        assertEq(p.unanswered, 0);
        assertEq(p.paidOut, toAgent);
    }

    function test_settle_atFloorIsTheLeastAPosterCanPay() public {
        uint256 id = _postClaimSubmit();
        vm.prank(poster);
        board.settle(id, FLOOR, 1);
        assertEq(usdc.balanceOf(agent), REWARD * FLOOR / 10_000);
    }

    /// The poster (or the poster's agent) grading the work below the floor can't take it for free.
    function test_settle_revertsBelowFloor() public {
        uint256 id = _postClaimSubmit();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidPayout.selector, FLOOR - 1, FLOOR));
        board.settle(id, FLOOR - 1, 1);

        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidPayout.selector, 0, FLOOR));
        board.settle(id, 0, 1);
    }

    function test_settle_revertsAboveFull() public {
        uint256 id = _postClaimSubmit();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidPayout.selector, 10_001, FLOOR));
        board.settle(id, 10_001, 5);
    }

    function test_settle_openJobMayPayNothing() public {
        vm.prank(poster);
        uint256 id = board.createBounty(REWARD, _deadline(), REVIEW, false, 0, BRIEF);
        vm.prank(outsider);
        board.claimBounty(id);
        vm.prank(outsider);
        board.submitWork(id, RESULT);

        uint256 posterBefore = usdc.balanceOf(poster);
        vm.prank(poster);
        board.settle(id, 0, 1);

        assertEq(usdc.balanceOf(outsider), 0);
        assertEq(usdc.balanceOf(poster), posterBefore + REWARD);
        assertEq(board.recordOf(outsider).paidBpsSum, 0);
    }

    function test_settle_revertsOnceReviewWindowClosed() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW);
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.ReviewWindowClosed.selector, id));
        board.settle(id, 10_000, 5);
    }

    function test_settle_revertsOnInvalidRating() public {
        uint256 id = _postClaimSubmit();
        vm.startPrank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidRating.selector, 0));
        board.settle(id, 10_000, 0);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidRating.selector, 6));
        board.settle(id, 10_000, 6);
        vm.stopPrank();
    }

    function test_settle_revertsForNonPoster() public {
        uint256 id = _postClaimSubmit();
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotPoster.selector, id));
        board.settle(id, 10_000, 5);
    }

    function test_settle_revertsBeforeSubmission() public {
        uint256 id = _postAndClaim();
        vm.prank(poster);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Claimed)
        );
        board.settle(id, 10_000, 5);
    }

    function test_settle_cannotPayTwice() public {
        uint256 id = _postClaimSubmit();
        vm.startPrank(poster);
        board.settle(id, 5_000, 3);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Paid)
        );
        board.settle(id, 10_000, 5);
        vm.stopPrank();
    }

    /// Settling closes the job: a poster can't settle at the floor and then claw the rest back.
    function test_settle_closesTheJobForGood() public {
        uint256 id = _postClaimSubmit();
        vm.prank(poster);
        board.settle(id, FLOOR, 1);

        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotRefundable.selector, id));
        board.cancelBounty(id);
        vm.prank(otherAgent);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Paid)
        );
        board.claimBounty(id);
    }

    function test_settle_worksWhilePaused() public {
        uint256 id = _postClaimSubmit();
        vm.prank(owner);
        board.pause();
        vm.prank(poster);
        board.settle(id, 10_000, 5);
        assertEq(usdc.balanceOf(agent), REWARD);
    }

    function testFuzz_settle_splitsWithoutLoss(uint96 reward, uint16 paidBps) public {
        reward = uint96(bound(reward, 1, MAX_REWARD));
        paidBps = uint16(bound(paidBps, FLOOR, 10_000));

        vm.prank(poster);
        uint256 id = board.createBounty(reward, _deadline(), REVIEW, true, FLOOR, BRIEF);
        vm.prank(agent);
        board.claimBounty(id);
        vm.prank(agent);
        board.submitWork(id, RESULT);

        uint256 posterBefore = usdc.balanceOf(poster);
        vm.prank(poster);
        board.settle(id, paidBps, 4);

        uint256 toAgent = usdc.balanceOf(agent);
        assertEq(toAgent, uint256(reward) * paidBps / 10_000);
        assertEq(toAgent + usdc.balanceOf(poster) - posterBefore, reward);
        assertEq(usdc.balanceOf(address(board)), 0);
    }

    function testFuzz_recordsAccumulate(uint16 a, uint16 b) public {
        a = uint16(bound(a, FLOOR, 10_000));
        b = uint16(bound(b, FLOOR, 10_000));

        uint256 first = _postClaimSubmit();
        vm.prank(poster);
        board.settle(first, a, 4);
        uint256 second = _postClaimSubmit();
        vm.prank(poster);
        board.settle(second, b, 2);

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.rated, 2);
        assertEq(r.ratingSum, 6);
        assertEq(r.paidBpsSum, uint64(a) + b);
        IBountyBoard.PosterRecord memory p = board.posterRecordOf(poster);
        assertEq(p.settled, 2);
        assertEq(p.paidBpsSum, uint64(a) + b);
    }

    // ---- release after timeout ------------------------------------------------------------------

    function test_release_paysAgentEverythingAfterWindow() public {
        uint256 id = _postClaimSubmit();
        vm.warp(block.timestamp + REVIEW);

        vm.expectEmit(address(board));
        emit IBountyBoard.PaymentReleasedAfterTimeout(id, agent, REWARD);
        vm.prank(agent);
        board.releaseAfterTimeout(id);

        assertEq(usdc.balanceOf(agent), REWARD);
        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(uint8(b.status), uint8(IBountyBoard.Status.Paid));
        assertEq(b.paidBps, 10_000);

        IBountyBoard.Record memory r = board.recordOf(agent);
        assertEq(r.paid, 1);
        assertEq(r.rated, 0);
        assertEq(r.timeoutReleases, 1);
        assertEq(r.paidBpsSum, 10_000);
        assertEq(r.earned, REWARD);

        IBountyBoard.PosterRecord memory p = board.posterRecordOf(poster);
        assertEq(p.settled, 0);
        assertEq(p.unanswered, 1);
        assertEq(p.paidOut, REWARD);
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
}
