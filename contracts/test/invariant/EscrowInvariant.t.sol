// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

import {BountyBoard} from "../../src/BountyBoard.sol";
import {IBountyBoard} from "../../src/interfaces/IBountyBoard.sol";
import {MockAgentID} from "../mocks/MockAgentID.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";

/// @notice Drives the board with random sequences of every action a poster or agent can take.
contract BoardHandler is Test {
    BountyBoard internal immutable board;
    MockUSDC internal immutable usdc;
    address[] internal actors;

    constructor(BountyBoard board_, MockUSDC usdc_, address[] memory actors_) {
        board = board_;
        usdc = usdc_;
        actors = actors_;
    }

    function create(
        uint256 actorSeed,
        uint96 reward,
        uint256 offset,
        uint256 windowSeed,
        bool agentIdOnly,
        uint16 floorSeed
    ) external {
        address actor = _actor(actorSeed);
        reward = uint96(bound(reward, 1, board.maxReward()));
        uint40 deadline = uint40(block.timestamp + bound(offset, board.MIN_DURATION(), board.MAX_DURATION()));
        uint32 window = uint32(bound(windowSeed, board.MIN_REVIEW_WINDOW(), board.MAX_REVIEW_WINDOW()));
        uint16 floor = agentIdOnly ? uint16(bound(floorSeed, board.minFloorBps(), board.maxFloorBps())) : 0;
        usdc.mint(actor, reward);
        vm.startPrank(actor);
        usdc.approve(address(board), reward);
        board.createBounty(reward, deadline, window, agentIdOnly, floor, "ipfs://brief");
        vm.stopPrank();
    }

    /// @dev Arguments are resolved before `vm.prank`, because the prank applies to the next external
    ///      call and reading the board would consume it.
    function claim(uint256 actorSeed, uint256 idSeed) external {
        uint256 id = _id(idSeed);
        address actor = _actor(actorSeed);
        vm.prank(actor);
        board.claimBounty(id);
    }

    function submit(uint256 idSeed) external {
        uint256 id = _id(idSeed);
        address agent = _agentOf(id);
        vm.prank(agent);
        board.submitWork(id, "ipfs://result");
    }

    function settle(uint256 idSeed, uint16 paidSeed, uint8 rating) external {
        uint256 id = _id(idSeed);
        address poster = _posterOf(id);
        uint16 floor = board.bountyCount() == 0 ? 0 : board.getBounty(id).floorBps;
        uint16 paidBps = uint16(bound(paidSeed, floor, 10_000));
        vm.prank(poster);
        board.settle(id, paidBps, uint8(bound(rating, 1, 5)));
    }

    /// The owner moving the floor range mid-flight must never touch funds already in escrow.
    function setRange(uint16 lo, uint16 hi) external {
        hi = uint16(bound(hi, 0, 9_000));
        lo = uint16(bound(lo, 0, hi));
        vm.prank(board.owner());
        board.setFloorRange(lo, hi);
    }

    function release(uint256 idSeed) external {
        uint256 id = _id(idSeed);
        address agent = _agentOf(id);
        vm.prank(agent);
        board.releaseAfterTimeout(id);
    }

    function cancel(uint256 idSeed) external {
        uint256 id = _id(idSeed);
        address poster = _posterOf(id);
        vm.prank(poster);
        board.cancelBounty(id);
    }

    /// @dev A stranger poking at a random bounty: every one of these must revert or change nothing.
    function meddle(uint256 actorSeed, uint256 idSeed, uint8 rating) external {
        uint256 id = _id(idSeed);
        address actor = _actor(actorSeed);
        vm.startPrank(actor);
        try board.settle(id, 10_000, uint8(bound(rating, 1, 5))) {} catch {}
        try board.releaseAfterTimeout(id) {} catch {}
        try board.cancelBounty(id) {} catch {}
        vm.stopPrank();
    }

    function wait(uint256 secondsSeed) external {
        vm.warp(block.timestamp + bound(secondsSeed, 1 minutes, 10 days));
    }

    function _actor(uint256 seed) private view returns (address) {
        return actors[seed % actors.length];
    }

    function _posterOf(uint256 id) private view returns (address) {
        return board.bountyCount() == 0 ? address(0) : board.getBounty(id).poster;
    }

    function _agentOf(uint256 id) private view returns (address) {
        return board.bountyCount() == 0 ? address(0) : board.getBounty(id).agent;
    }

    function _id(uint256 seed) private view returns (uint256) {
        uint256 count = board.bountyCount();
        return count == 0 ? 1 : (seed % count) + 1;
    }
}

/// @notice Whatever happens, escrow holds exactly the rewards of bounties that are still live.
contract EscrowInvariantTest is Test {
    BountyBoard internal board;
    MockUSDC internal usdc;
    BoardHandler internal handler;

    function setUp() public {
        usdc = new MockUSDC();
        MockAgentID ids = new MockAgentID();
        board = new BountyBoard(usdc, ids, 100e18, address(this));

        // Three Agent ID holders and one plain wallet, so open and Agent-ID-only jobs both get exercised.
        address[] memory actors = new address[](4);
        for (uint256 i; i < actors.length; ++i) {
            actors[i] = makeAddr(string.concat("actor", vm.toString(i)));
            if (i < 3) ids.issue(actors[i]);
        }

        handler = new BoardHandler(board, usdc, actors);
        targetContract(address(handler));
    }

    function invariant_escrowEqualsLiveRewards() public view {
        uint256 live;
        uint256 count = board.bountyCount();
        for (uint256 id = 1; id <= count; ++id) {
            IBountyBoard.Bounty memory b = board.getBounty(id);
            if (
                b.status == IBountyBoard.Status.Open || b.status == IBountyBoard.Status.Claimed
                    || b.status == IBountyBoard.Status.Submitted
            ) live += b.reward;
        }
        assertEq(usdc.balanceOf(address(board)), live);
    }
}
