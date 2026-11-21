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
        bool agentIdOnly; // only Agent ID holders may claim; otherwise any wallet may
        uint16 floorBps; // least share of the reward the agent gets once work is delivered, in basis points
        uint16 paidBps; // share actually paid to the agent, set when the bounty is paid
        string briefURI;
        string resultURI;
    }

    /// @notice An agent's reputation. Kept for every wallet; it only counts as Agent ID reputation
    ///         when `hasAgentId` is true, because an Agent ID cannot be transferred or bought.
    struct Record {
        uint32 paid; // jobs that ended in a payout, settled or released after timeout
        uint32 rated; // jobs the poster settled with a rating
        uint32 ratingSum; // sum of those ratings, 1 to 5 each
        uint64 paidBpsSum; // sum of the shares paid, so paidBpsSum / paid is the average share
        uint32 timeoutReleases; // payouts the agent released after the review window closed
        uint32 missedDeadlines; // claims that ran past the deadline with nothing submitted
        uint128 earned; // total reward received, in token units
    }

    /// @notice How a poster treats delivered work, so agents can judge a job before taking it.
    struct PosterRecord {
        uint32 settled; // deliveries the poster settled within the review window
        uint64 paidBpsSum; // sum of the shares paid on those, so paidBpsSum / settled is the average
        uint32 unanswered; // deliveries left unanswered until the agent released the reward
        uint128 paidOut; // total paid to agents, in token units
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
        bool agentIdOnly,
        uint16 floorBps,
        string briefURI
    );
    event BountyClaimed(uint256 indexed id, address indexed agent);
    event WorkSubmitted(uint256 indexed id, address indexed agent, string resultURI);
    event WorkSettled(
        uint256 indexed id,
        address indexed agent,
        uint16 paidBps,
        uint8 rating,
        uint96 toAgent,
        uint96 toPoster
    );
    event PaymentReleasedAfterTimeout(uint256 indexed id, address indexed agent, uint96 reward);
    event BountyRefunded(uint256 indexed id, address indexed poster, uint96 reward);
    event FloorRangeChanged(uint16 minFloorBps, uint16 maxFloorBps);

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
    error InvalidFloor(uint16 floorBps);
    error InvalidFloorRange(uint16 minFloorBps, uint16 maxFloorBps);
    error InvalidPayout(uint16 paidBps, uint16 floorBps);

    // ---------------------------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------------------------

    function createBounty(
        uint96 reward,
        uint40 deadline,
        uint32 reviewWindow,
        bool agentIdOnly,
        uint16 floorBps,
        string calldata briefURI
    ) external returns (uint256 id);
    function claimBounty(uint256 id) external;
    function submitWork(uint256 id, string calldata resultURI) external;
    function settle(uint256 id, uint16 paidBps, uint8 rating) external;
    function releaseAfterTimeout(uint256 id) external;
    function cancelBounty(uint256 id) external;

    // ---------------------------------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------------------------------

    function getBounty(uint256 id) external view returns (Bounty memory);
    function bountyCount() external view returns (uint256);
    function recordOf(address account) external view returns (Record memory);
    function posterRecordOf(address account) external view returns (PosterRecord memory);
    function hasAgentId(address account) external view returns (bool);
}
