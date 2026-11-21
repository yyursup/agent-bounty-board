// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IAgentID} from "./interfaces/IAgentID.sol";
import {IBountyBoard} from "./interfaces/IBountyBoard.sol";

/// @title Agent Bounty Board
/// @notice Small jobs with the reward held in escrow. Anyone can post; each job says whether only
///         Agent ID holders may pick it up (the default in the app) or any wallet may.
///
///         Escrowed funds leave the contract by exactly three routes:
///           1. the poster settles the delivery          -> a share of at least the job's floor goes to
///                                                          the agent, the rest back to the poster
///           2. the review window closes unanswered      -> the agent releases all of it to itself
///           3. nothing is delivered                     -> refunded to the poster
///
///         The floor is the poster's promise, fixed when the job is posted: once work is delivered,
///         the agent gets at least that share, however the poster or the poster's agent grades it.
///         Jobs open to any wallet have no floor, so throwaway wallets can't farm it with junk.
///
/// @dev Owner powers: pausing the creation of new bounties, and setting the range posters may
///      choose a floor from. Both apply to new bounties only. The owner cannot move, freeze or
///      redirect escrowed funds, and payouts and refunds keep working while paused.
contract BountyBoard is IBountyBoard, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------------------------------------------

    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 30 days;
    uint32 public constant MIN_REVIEW_WINDOW = 24 hours;
    uint32 public constant MAX_REVIEW_WINDOW = 7 days;
    uint8 public constant MAX_RATING = 5;
    uint16 public constant FULL_BPS = 10_000;
    /// @notice The highest floor the owner may allow, so there is always something left to grade.
    uint16 public constant MAX_FLOOR_BPS = 9_000;

    /// @notice The token rewards are paid in (USDC on BNB Chain).
    IERC20 public immutable rewardToken;
    /// @notice The Agent ID collection that gates claiming on Agent-ID-only jobs.
    IAgentID public immutable agentId;
    /// @notice Upper bound for a single reward while the contract is unaudited.
    uint96 public immutable maxReward;

    // ---------------------------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------------------------

    uint256 private _bountyCount;
    mapping(uint256 id => Bounty) private _bounties;
    mapping(address account => Record) private _records;
    mapping(address account => PosterRecord) private _posterRecords;

    /// @notice Floors posters may choose for Agent-ID-only jobs, in basis points (10% to 50% at launch).
    uint16 public minFloorBps = 1_000;
    uint16 public maxFloorBps = 5_000;

    // ---------------------------------------------------------------------------------------------
    // Setup
    // ---------------------------------------------------------------------------------------------

    constructor(IERC20 rewardToken_, IAgentID agentId_, uint96 maxReward_, address owner_) Ownable(owner_) {
        if (address(rewardToken_) == address(0) || address(agentId_) == address(0)) revert ZeroAddress();
        if (maxReward_ == 0) revert InvalidReward(0);
        rewardToken = rewardToken_;
        agentId = agentId_;
        maxReward = maxReward_;
    }

    // ---------------------------------------------------------------------------------------------
    // Poster actions
    // ---------------------------------------------------------------------------------------------

    /// @inheritdoc IBountyBoard
    /// @dev The caller must first approve exactly `reward` for this contract. Posting needs no
    ///      Agent ID: the poster's money is at stake, not anyone's reputation.
    /// @dev `floorBps` must be within the owner's range for Agent-ID-only jobs, and zero for jobs open
    ///      to any wallet.
    function createBounty(
        uint96 reward,
        uint40 deadline,
        uint32 reviewWindow,
        bool agentIdOnly,
        uint16 floorBps,
        string calldata briefURI
    ) external whenNotPaused nonReentrant returns (uint256 id) {
        if (reward == 0 || reward > maxReward) revert InvalidReward(reward);
        if (deadline < block.timestamp + MIN_DURATION || deadline > block.timestamp + MAX_DURATION) {
            revert InvalidDeadline(deadline);
        }
        if (reviewWindow < MIN_REVIEW_WINDOW || reviewWindow > MAX_REVIEW_WINDOW) {
            revert InvalidReviewWindow(reviewWindow);
        }
        if (bytes(briefURI).length == 0) revert EmptyURI();
        if (agentIdOnly ? (floorBps < minFloorBps || floorBps > maxFloorBps) : floorBps != 0) {
            revert InvalidFloor(floorBps);
        }

        id = ++_bountyCount;
        Bounty storage b = _bounties[id];
        b.poster = msg.sender;
        b.reward = reward;
        b.deadline = deadline;
        b.reviewWindow = reviewWindow;
        b.status = Status.Open;
        b.agentIdOnly = agentIdOnly;
        b.floorBps = floorBps;
        b.briefURI = briefURI;

        emit BountyCreated(id, msg.sender, reward, deadline, reviewWindow, agentIdOnly, floorBps, briefURI);

        _pullExact(msg.sender, reward);
    }

    /// @inheritdoc IBountyBoard
    /// @dev Only while the review window is open. Pays `paidBps` of the reward to the agent, at
    ///      least the job's floor, and returns the rest to the poster. The bounty closes either way.
    function settle(uint256 id, uint16 paidBps, uint8 rating) external nonReentrant {
        Bounty storage b = _onlyPoster(id);
        _requireStatus(id, b, Status.Submitted);
        if (block.timestamp >= _reviewEnds(b)) revert ReviewWindowClosed(id);
        if (paidBps < b.floorBps || paidBps > FULL_BPS) revert InvalidPayout(paidBps, b.floorBps);
        if (rating == 0 || rating > MAX_RATING) revert InvalidRating(rating);

        uint96 toAgent = uint96((uint256(b.reward) * paidBps) / FULL_BPS);
        uint96 toPoster = b.reward - toAgent;

        b.status = Status.Paid;
        b.paidBps = paidBps;

        Record storage r = _records[b.agent];
        r.paid += 1;
        r.rated += 1;
        r.ratingSum += rating;
        r.paidBpsSum += paidBps;
        r.earned += toAgent;

        PosterRecord storage p = _posterRecords[msg.sender];
        p.settled += 1;
        p.paidBpsSum += paidBps;
        p.paidOut += toAgent;

        emit WorkSettled(id, b.agent, paidBps, rating, toAgent, toPoster);

        if (toAgent > 0) rewardToken.safeTransfer(b.agent, toAgent);
        if (toPoster > 0) rewardToken.safeTransfer(msg.sender, toPoster);
    }

    /// @inheritdoc IBountyBoard
    /// @dev Open bounties can be cancelled at any time. Claimed ones only after the deadline passed
    ///      with nothing submitted, which counts as a missed deadline for the agent.
    function cancelBounty(uint256 id) external nonReentrant {
        Bounty storage b = _onlyPoster(id);

        if (b.status == Status.Claimed) {
            if (block.timestamp <= b.deadline) revert NotRefundable(id);
            _records[b.agent].missedDeadlines += 1;
        } else if (b.status != Status.Open) {
            revert NotRefundable(id);
        }

        b.status = Status.Refunded;
        emit BountyRefunded(id, b.poster, b.reward);

        rewardToken.safeTransfer(b.poster, b.reward);
    }

    // ---------------------------------------------------------------------------------------------
    // Agent actions
    // ---------------------------------------------------------------------------------------------

    /// @inheritdoc IBountyBoard
    /// @dev The Agent ID check is made at claim time, against the wallet that will do the work.
    function claimBounty(uint256 id) external {
        Bounty storage b = _existing(id);
        _requireStatus(id, b, Status.Open);
        if (b.agentIdOnly) _requireAgentId(msg.sender);
        if (b.poster == msg.sender) revert CannotClaimOwnBounty(id);
        if (block.timestamp >= b.deadline) revert DeadlinePassed(id);

        b.agent = msg.sender;
        b.status = Status.Claimed;

        emit BountyClaimed(id, msg.sender);
    }

    /// @inheritdoc IBountyBoard
    function submitWork(uint256 id, string calldata resultURI) external {
        Bounty storage b = _onlyAgent(id);
        _requireStatus(id, b, Status.Claimed);
        if (block.timestamp > b.deadline) revert DeadlinePassed(id);
        if (bytes(resultURI).length == 0) revert EmptyURI();

        b.resultURI = resultURI;
        b.submittedAt = uint40(block.timestamp);
        b.status = Status.Submitted;

        emit WorkSubmitted(id, msg.sender, resultURI);
    }

    /// @inheritdoc IBountyBoard
    function releaseAfterTimeout(uint256 id) external nonReentrant {
        Bounty storage b = _onlyAgent(id);
        _requireStatus(id, b, Status.Submitted);
        if (block.timestamp < _reviewEnds(b)) revert ReviewWindowOpen(id);

        b.status = Status.Paid;
        b.paidBps = FULL_BPS;

        Record storage r = _records[b.agent];
        r.paid += 1;
        r.timeoutReleases += 1;
        r.paidBpsSum += FULL_BPS;
        r.earned += b.reward;

        PosterRecord storage p = _posterRecords[b.poster];
        p.unanswered += 1;
        p.paidOut += b.reward;

        emit PaymentReleasedAfterTimeout(id, b.agent, b.reward);

        rewardToken.safeTransfer(b.agent, b.reward);
    }

    // ---------------------------------------------------------------------------------------------
    // Owner
    // ---------------------------------------------------------------------------------------------

    /// @notice Stops new bounties from being created. Everything else keeps working.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Sets the floors posters may choose for new Agent-ID-only jobs. Jobs already posted
    ///         keep the floor they were posted with.
    function setFloorRange(uint16 minFloorBps_, uint16 maxFloorBps_) external onlyOwner {
        if (minFloorBps_ > maxFloorBps_ || maxFloorBps_ > MAX_FLOOR_BPS) {
            revert InvalidFloorRange(minFloorBps_, maxFloorBps_);
        }
        minFloorBps = minFloorBps_;
        maxFloorBps = maxFloorBps_;
        emit FloorRangeChanged(minFloorBps_, maxFloorBps_);
    }

    // ---------------------------------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------------------------------

    /// @inheritdoc IBountyBoard
    function getBounty(uint256 id) external view returns (Bounty memory) {
        return _existing(id);
    }

    /// @inheritdoc IBountyBoard
    function bountyCount() external view returns (uint256) {
        return _bountyCount;
    }

    /// @inheritdoc IBountyBoard
    function recordOf(address account) external view returns (Record memory) {
        return _records[account];
    }

    /// @inheritdoc IBountyBoard
    function posterRecordOf(address account) external view returns (PosterRecord memory) {
        return _posterRecords[account];
    }

    /// @inheritdoc IBountyBoard
    function hasAgentId(address account) public view returns (bool) {
        return agentId.balanceOf(account) > 0;
    }

    // ---------------------------------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------------------------------

    function _requireAgentId(address account) private view {
        if (!hasAgentId(account)) revert NotAgentIdHolder(account);
    }

    function _existing(uint256 id) private view returns (Bounty storage b) {
        b = _bounties[id];
        if (b.status == Status.None) revert BountyNotFound(id);
    }

    function _onlyPoster(uint256 id) private view returns (Bounty storage b) {
        b = _existing(id);
        if (b.poster != msg.sender) revert NotPoster(id);
    }

    function _onlyAgent(uint256 id) private view returns (Bounty storage b) {
        b = _existing(id);
        if (b.agent != msg.sender) revert NotAgent(id);
    }

    function _requireStatus(uint256 id, Bounty storage b, Status expected) private view {
        if (b.status != expected) revert WrongStatus(id, b.status);
    }

    function _reviewEnds(Bounty storage b) private view returns (uint256) {
        return uint256(b.submittedAt) + b.reviewWindow;
    }

    /// @dev Rejects tokens that deliver less than requested (fee-on-transfer), so escrow always
    ///      holds exactly what the bounty promises.
    function _pullExact(address from, uint256 amount) private {
        uint256 before = rewardToken.balanceOf(address(this));
        rewardToken.safeTransferFrom(from, address(this), amount);
        if (rewardToken.balanceOf(address(this)) - before != amount) revert UnsupportedToken();
    }
}
