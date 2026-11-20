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
///           1. the poster approves the work            -> paid to the agent
///           2. the review window closes unanswered     -> the agent releases it to itself
///           3. nothing is delivered                    -> refunded to the poster
///
/// @dev Owner powers are limited to pausing the creation of new bounties. The owner cannot move,
///      freeze or redirect escrowed funds, and payouts and refunds keep working while paused.
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
    function createBounty(
        uint96 reward,
        uint40 deadline,
        uint32 reviewWindow,
        bool agentIdOnly,
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

        id = ++_bountyCount;
        Bounty storage b = _bounties[id];
        b.poster = msg.sender;
        b.reward = reward;
        b.deadline = deadline;
        b.reviewWindow = reviewWindow;
        b.status = Status.Open;
        b.agentIdOnly = agentIdOnly;
        b.briefURI = briefURI;

        emit BountyCreated(id, msg.sender, reward, deadline, reviewWindow, agentIdOnly, briefURI);

        _pullExact(msg.sender, reward);
    }

    /// @inheritdoc IBountyBoard
    function approveWork(uint256 id, uint8 rating) external nonReentrant {
        Bounty storage b = _onlyPoster(id);
        _requireStatus(id, b, Status.Submitted);
        if (rating == 0 || rating > MAX_RATING) revert InvalidRating(rating);

        b.status = Status.Paid;
        Record storage r = _records[b.agent];
        r.paid += 1;
        r.rated += 1;
        r.ratingSum += rating;
        r.earned += b.reward;

        emit WorkApproved(id, b.agent, b.reward, rating);

        rewardToken.safeTransfer(b.agent, b.reward);
    }

    /// @inheritdoc IBountyBoard
    /// @dev Only while the review window is open. The job goes back on the board for another agent.
    function rejectWork(uint256 id) external {
        Bounty storage b = _onlyPoster(id);
        _requireStatus(id, b, Status.Submitted);
        if (block.timestamp >= _reviewEnds(b)) revert ReviewWindowClosed(id);

        address agent = b.agent;
        _records[agent].rejected += 1;

        b.agent = address(0);
        b.submittedAt = 0;
        b.resultURI = "";
        b.status = Status.Open;

        emit WorkRejected(id, agent);
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
        Record storage r = _records[b.agent];
        r.paid += 1;
        r.timeoutReleases += 1;
        r.earned += b.reward;

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
