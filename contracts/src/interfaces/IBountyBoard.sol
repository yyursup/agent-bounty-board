// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Types, events and errors of the Agent Bounty Board, kept apart from the logic so that
///         off-chain code and tests can depend on the shape without the implementation.
interface IBountyBoard {
    // ---------------------------------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------------------------------

    /// @dev `None` is the zero value, so an unknown id reads as `None`.
    enum Status {
        None,
        Open,
        Claimed,
        Submitted,
        Paid,
        Refunded
    }

    struct Bounty {
        address poster;
        uint96 reward;
        address agent;
        uint40 deadline;
        uint40 submittedAt;
        uint32 reviewWindow;
        Status status;
        string briefURI;
        string resultURI;
    }

    /// @notice Reputation tied to an address. Because an Agent ID cannot be transferred, it cannot be bought.
    struct Record {
        uint32 paid; // jobs that ended in a payout, approved or released after timeout
        uint32 rated; // jobs the poster approved with a rating
        uint32 ratingSum; // sum of those ratings, 1 to 5 each
        uint32 rejected; // submissions the poster rejected
        uint32 timeoutReleases; // payouts the agent released after the review window closed
        uint32 missedDeadlines; // claims that ran past the deadline with nothing submitted
        uint128 earned; // total reward received, in token units
    }

    // ---------------------------------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------------------------------

    event BountyCreated(
        uint256 indexed id,
        address indexed poster,
        uint96 reward,
        uint40 deadline,
        uint32 reviewWindow,
        string briefURI
    );
    event BountyClaimed(uint256 indexed id, address indexed agent);
    event WorkSubmitted(uint256 indexed id, address indexed agent, string resultURI);
    event WorkApproved(uint256 indexed id, address indexed agent, uint96 reward, uint8 rating);
    event WorkRejected(uint256 indexed id, address indexed agent);
    event PaymentReleasedAfterTimeout(uint256 indexed id, address indexed agent, uint96 reward);
    event BountyRefunded(uint256 indexed id, address indexed poster, uint96 reward);

    // ---------------------------------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------------------------------

    error ZeroAddress();
    error NotAgentIdHolder(address account);
    error InvalidReward(uint256 reward);
    error InvalidDeadline(uint256 deadline);
    error InvalidReviewWindow(uint256 reviewWindow);
    error InvalidRating(uint8 rating);
    error EmptyURI();
    error UnsupportedToken();
    error BountyNotFound(uint256 id);
    error WrongStatus(uint256 id, Status status);
    error NotPoster(uint256 id);
    error NotAgent(uint256 id);
    error CannotClaimOwnBounty(uint256 id);
    error DeadlinePassed(uint256 id);
    error ReviewWindowOpen(uint256 id);
    error ReviewWindowClosed(uint256 id);
    error NotRefundable(uint256 id);

    // ---------------------------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------------------------

    function createBounty(uint96 reward, uint40 deadline, uint32 reviewWindow, string calldata briefURI)
        external
        returns (uint256 id);
    function claimBounty(uint256 id) external;
    function submitWork(uint256 id, string calldata resultURI) external;
    function approveWork(uint256 id, uint8 rating) external;
    function rejectWork(uint256 id) external;
    function releaseAfterTimeout(uint256 id) external;
    function cancelBounty(uint256 id) external;

    // ---------------------------------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------------------------------

    function getBounty(uint256 id) external view returns (Bounty memory);
    function bountyCount() external view returns (uint256);
    function recordOf(address account) external view returns (Record memory);
    function hasAgentId(address account) external view returns (bool);
}
