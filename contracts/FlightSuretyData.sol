pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Airlines
    struct Airline {
        string name;
        bool exists;
        bool registered;
        uint256 invested;
        uint256 voteCount;
    }

    address private contractOwner;                                      // Account used to deploy contract
    address private appContractOwner;                                   // Address of application contract owner
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => Airline) private airlines;                       // Airline companies participating in contract
    uint256 private airlineCount = 0;                                   // Number of airline companies participating in contract
    mapping(bytes32 => address[]) private flights;                      // Map of flight of insurees
    mapping(address => uint256) private insureesBalance;                // Map of insurees balance

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline, string firstAirlineName) public {
        contractOwner = msg.sender;
        _addAirline(firstAirline, firstAirlineName);
        _registerAirline(firstAirline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires the Application "ContractOwner" account to be the function caller
     */
    modifier requireAppContractOwner() {
        require(msg.sender == appContractOwner, "Caller is not App contract owner");
        _;
    }

    /**
     * @dev Modifier that requires the Airline be registered
     */
    modifier requireRegistredAirline(address applicantAirline) {
        require(airlines[applicantAirline].registered == true, "Applicant air line is not a registered Airline");
        _;
    }

    /**
     * @dev Modifier that requires the Airline has funds
     */
    modifier requireFundedAirline(address applicantAirline) {
        require(airlines[applicantAirline].invested >= (10 ether), "Applicant air line has not enough fund");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns(bool) {
        return operational;
    }


    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus (bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * Authorize application contract owner calls this contract. Only this address can call
     * data contract business methods.
     */
    function authorizeCaller(address _appContractOwner) external requireIsOperational requireContractOwner {
         appContractOwner = _appContractOwner;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function addAirline (address airline, address newAirline, string name)
            external payable requireIsOperational requireAppContractOwner
                     requireRegistredAirline(airline) requireFundedAirline(airline) {
        _addAirline(newAirline, name);
    }

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function _addAirline (address newCompany, string name) private {
        Airline memory airline = Airline(name, true, false, 0, 0);
        airlines[newCompany] = airline;
        airlineCount++;
    }

    /**
     * @dev Aprove an Airline to participate to insurance
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline, address applicantAirline)
            external requireIsOperational requireAppContractOwner
                     requireRegistredAirline(airline) requireFundedAirline(airline) {
        _registerAirline(applicantAirline);
    }

    /**
     * @dev Aprove an Airline to participate to insurance
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function _registerAirline(address applicantAirline) private {
        airlines[applicantAirline].registered = true;
    }

    /**
     * @dev Allowed airline votes to new one airline
     */
    function vote(address airline, address applicantAirline)
            external requireIsOperational requireAppContractOwner
                     requireRegistredAirline(airline) requireFundedAirline(airline) {
        airlines[applicantAirline].voteCount++;
    }

    /**
     * @dev Add funds to airline address
     */
    function addFundsToAirline(address airline, uint256 value) external requireIsOperational requireAppContractOwner {
        airlines[airline].invested += value;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(address airline, string flight, uint256 timestamp, address insuree)
            external payable requireIsOperational requireAppContractOwner {

        address(this).transfer(msg.value);

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flights[flightKey].push(insuree);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(address airline, string flight, uint256 timestamp, uint256 value)
            external requireIsOperational requireAppContractOwner {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        for (uint256 i = 0; i < flights[flightKey].length; i++) {
            uint256 currentBalance = insureesBalance[flights[flightKey][i]];
            uint256 newBalance = currentBalance + (value);
            insureesBalance[flights[flightKey][i]] = newBalance;
        }
        delete flights[flightKey];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address insuree) external payable requireIsOperational requireAppContractOwner {
        require(insureesBalance[insuree] > 0, "This insuree has no balance.");
        uint256 value = insureesBalance[insuree];
        insureesBalance[insuree] = 0;
        insuree.transfer(value);
    }

    /**
     * Returns a key to access flights map
     */
    function getFlightKey (address airline, string memory flight, uint256 timestamp) private pure returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Returns information about Airline.
     */
    function getAirline(address airlineAddress) external view requireIsOperational requireAppContractOwner
                                                returns(string name, bool registered, uint invested, uint voteCount) {
        Airline memory airline = airlines[airlineAddress];
        return(airline.name, airline.registered, airline.invested, airline.voteCount);
    }

    /**
     * @dev Check Airline existance
     */
    function airlineExists(address airline) external view requireIsOperational requireAppContractOwner returns (bool) {
        return airlines[airline].exists;
    }

    /**
     * @dev Returns the number of Airline votes.
     */
    function getAirlineVoteCount(address airlineAddress) external view requireIsOperational requireAppContractOwner returns(uint256) {
        Airline memory airline = airlines[airlineAddress];
        return(airline.voteCount);
    }

    /**
     * @dev Returns the number of Airlines.
     */
    function getAirlineCount() external view requireIsOperational requireAppContractOwner returns(uint256) {
        return airlineCount;
    }

    /**
     * @dev Get insurees credit balance.
     */
    function getInsureeBalance(address insuree) external view requireIsOperational returns(uint256) {
        return insureesBalance[insuree];
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
    }

}

