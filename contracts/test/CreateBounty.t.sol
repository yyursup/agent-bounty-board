// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {BountyBoard} from "../src/BountyBoard.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";
import {MockAgentID} from "./mocks/MockAgentID.sol";
import {FeeOnTransferToken} from "./mocks/MockUSDC.sol";

contract CreateBountyTest is BaseTest {
    function test_create_locksExactRewardAndStoresBounty() public {
        uint256 before = usdc.balanceOf(poster);
        uint40 deadline = _deadline();

        vm.expectEmit(address(board));
        emit IBountyBoard.BountyCreated(1, poster, REWARD, deadline, REVIEW, BRIEF);
        vm.prank(poster);
        uint256 id = board.createBounty(REWARD, deadline, REVIEW, BRIEF);

        assertEq(id, 1);
        assertEq(board.bountyCount(), 1);
        assertEq(usdc.balanceOf(address(board)), REWARD);
        assertEq(usdc.balanceOf(poster), before - REWARD);

        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(b.poster, poster);
        assertEq(b.reward, REWARD);
        assertEq(b.agent, address(0));
        assertEq(b.deadline, deadline);
        assertEq(b.reviewWindow, REVIEW);
        assertEq(uint8(b.status), uint8(IBountyBoard.Status.Open));
        assertEq(b.briefURI, BRIEF);
    }

    function test_create_idsIncrement() public {
        assertEq(_post(), 1);
        assertEq(_post(), 2);
        assertEq(board.bountyCount(), 2);
    }

    function test_create_revertsWithoutAgentId() public {
        usdc.mint(outsider, REWARD);
        vm.startPrank(outsider);
        usdc.approve(address(board), REWARD);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotAgentIdHolder.selector, outsider));
        board.createBounty(REWARD, _deadline(), REVIEW, BRIEF);
        vm.stopPrank();
    }

    function test_create_revertsOnZeroOrTooLargeReward() public {
        vm.startPrank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidReward.selector, 0));
        board.createBounty(0, _deadline(), REVIEW, BRIEF);

        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidReward.selector, MAX_REWARD + 1));
        board.createBounty(MAX_REWARD + 1, _deadline(), REVIEW, BRIEF);
        vm.stopPrank();
    }

    function test_create_revertsOnDeadlineOutOfRange() public {
        uint40 tooSoon = uint40(block.timestamp + 30 minutes);
        uint40 tooLate = uint40(block.timestamp + 31 days);
        vm.startPrank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidDeadline.selector, tooSoon));
        board.createBounty(REWARD, tooSoon, REVIEW, BRIEF);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidDeadline.selector, tooLate));
        board.createBounty(REWARD, tooLate, REVIEW, BRIEF);
        vm.stopPrank();
    }

    function test_create_revertsOnReviewWindowOutOfRange() public {
        vm.startPrank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidReviewWindow.selector, 1 hours));
        board.createBounty(REWARD, _deadline(), 1 hours, BRIEF);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidReviewWindow.selector, 8 days));
        board.createBounty(REWARD, _deadline(), 8 days, BRIEF);
        vm.stopPrank();
    }

    function test_create_revertsOnEmptyBrief() public {
        vm.prank(poster);
        vm.expectRevert(IBountyBoard.EmptyURI.selector);
        board.createBounty(REWARD, _deadline(), REVIEW, "");
    }

    function test_create_revertsWhilePaused() public {
        vm.prank(owner);
        board.pause();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        board.createBounty(REWARD, _deadline(), REVIEW, BRIEF);
    }

    function test_create_revertsWithFeeOnTransferToken() public {
        FeeOnTransferToken fee = new FeeOnTransferToken();
        MockAgentID localIds = new MockAgentID();
        BountyBoard feeBoard = new BountyBoard(fee, localIds, MAX_REWARD, owner);
        localIds.issue(poster);
        fee.mint(poster, REWARD);

        vm.startPrank(poster);
        fee.approve(address(feeBoard), REWARD);
        vm.expectRevert(IBountyBoard.UnsupportedToken.selector);
        feeBoard.createBounty(REWARD, _deadline(), REVIEW, BRIEF);
        vm.stopPrank();
    }

    function test_constructor_rejectsBadConfig() public {
        vm.expectRevert(IBountyBoard.ZeroAddress.selector);
        new BountyBoard(usdc, MockAgentID(address(0)), MAX_REWARD, owner);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.InvalidReward.selector, 0));
        new BountyBoard(usdc, ids, 0, owner);
    }

    function testFuzz_create_acceptsAnyRewardWithinCap(uint96 reward) public {
        reward = uint96(bound(reward, 1, MAX_REWARD));
        vm.prank(poster);
        uint256 id = board.createBounty(reward, _deadline(), REVIEW, BRIEF);
        assertEq(board.getBounty(id).reward, reward);
        assertEq(usdc.balanceOf(address(board)), reward);
    }

    function testFuzz_create_acceptsAnyDeadlineWithinRange(uint256 offset) public {
        offset = bound(offset, board.MIN_DURATION(), board.MAX_DURATION());
        // forge-lint: disable-next-line(unsafe-typecast)
        uint40 deadline = uint40(block.timestamp + offset); // bounded to 30 days ahead
        vm.prank(poster);
        uint256 id = board.createBounty(REWARD, deadline, REVIEW, BRIEF);
        assertEq(board.getBounty(id).deadline, deadline);
    }

    function test_getBounty_revertsForUnknownId() public {
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.BountyNotFound.selector, 7));
        board.getBounty(7);
    }
}
