// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {IBountyBoard} from "../src/interfaces/IBountyBoard.sol";

contract ClaimAndSubmitTest is BaseTest {
    // ---- claim ----------------------------------------------------------------------------------

    function test_claim_assignsAgent() public {
        uint256 id = _post();
        vm.expectEmit(address(board));
        emit IBountyBoard.BountyClaimed(id, agent);
        vm.prank(agent);
        board.claimBounty(id);

        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(b.agent, agent);
        assertEq(uint8(b.status), uint8(IBountyBoard.Status.Claimed));
    }

    function test_claim_revertsWithoutAgentId() public {
        uint256 id = _post();
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotAgentIdHolder.selector, outsider));
        board.claimBounty(id);
    }

    function test_claim_revertsForOwnBounty() public {
        uint256 id = _post();
        vm.prank(poster);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.CannotClaimOwnBounty.selector, id));
        board.claimBounty(id);
    }

    function test_claim_revertsWhenAlreadyClaimed() public {
        uint256 id = _postAndClaim();
        vm.prank(otherAgent);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Claimed)
        );
        board.claimBounty(id);
    }

    function test_claim_revertsAtOrAfterDeadline() public {
        uint256 id = _post();
        vm.warp(board.getBounty(id).deadline);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.DeadlinePassed.selector, id));
        board.claimBounty(id);
    }

    function test_claim_stillWorksWhilePaused() public {
        uint256 id = _post();
        vm.prank(owner);
        board.pause();
        vm.prank(agent);
        board.claimBounty(id);
        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Claimed));
    }

    function test_claim_revertsForUnknownId() public {
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.BountyNotFound.selector, 42));
        board.claimBounty(42);
    }

    // ---- submit ---------------------------------------------------------------------------------

    function test_submit_recordsResultAndStartsReview() public {
        uint256 id = _postAndClaim();
        vm.warp(block.timestamp + 1 hours);

        vm.expectEmit(address(board));
        emit IBountyBoard.WorkSubmitted(id, agent, RESULT);
        vm.prank(agent);
        board.submitWork(id, RESULT);

        IBountyBoard.Bounty memory b = board.getBounty(id);
        assertEq(uint8(b.status), uint8(IBountyBoard.Status.Submitted));
        assertEq(b.resultURI, RESULT);
        assertEq(b.submittedAt, block.timestamp);
    }

    function test_submit_allowedExactlyAtDeadline() public {
        uint256 id = _postAndClaim();
        vm.warp(board.getBounty(id).deadline);
        vm.prank(agent);
        board.submitWork(id, RESULT);
        assertEq(uint8(_status(id)), uint8(IBountyBoard.Status.Submitted));
    }

    function test_submit_revertsAfterDeadline() public {
        uint256 id = _postAndClaim();
        vm.warp(uint256(board.getBounty(id).deadline) + 1);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.DeadlinePassed.selector, id));
        board.submitWork(id, RESULT);
    }

    function test_submit_revertsForSomeoneElse() public {
        uint256 id = _postAndClaim();
        vm.prank(otherAgent);
        vm.expectRevert(abi.encodeWithSelector(IBountyBoard.NotAgent.selector, id));
        board.submitWork(id, RESULT);
    }

    function test_submit_revertsOnEmptyResult() public {
        uint256 id = _postAndClaim();
        vm.prank(agent);
        vm.expectRevert(IBountyBoard.EmptyURI.selector);
        board.submitWork(id, "");
    }

    function test_submit_revertsWhenAlreadySubmitted() public {
        uint256 id = _postClaimSubmit();
        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(IBountyBoard.WrongStatus.selector, id, IBountyBoard.Status.Submitted)
        );
        board.submitWork(id, RESULT);
    }
}
