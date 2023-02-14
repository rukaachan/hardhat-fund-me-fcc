// SPDX-License-Identifier: MIT

//todo : Solidity style guid

//! 1. Pragma statements
pragma solidity ^0.8.8;

//! 2. Import statements
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

//! 3. Interfaces,
//! 4. Libraries
//! 5 Contracts

// TODO: @title contract untuk dalam menaruh dana
// ?: @author Ruka-sarashina
// !: @notice contract ini dibuat untuk demo menaruh dana
// TODO: @dev ini adalah implementasi priceFeed sebagai libray

error FundMe_NotOwner();

contract FundMe {
    //! Type declaration
    using PriceConverter for uint256;

    //! State variabel
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    address private immutable i_owner;
    uint256 public constant MINIMUMUSD = 50 * 10**18;

    AggregatorV3Interface public s_priceFeed; //? terjadi interacting libray

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe_NotOwner();
        }
        _;
    }

    /** Order of function
     * constructor
     * receive function (if exists)
     * fallback function (if exists)
     * external
     * public
     * internal
     * private
     */

    constructor(address priceFeedAddress) {
        //! constructor adalah sebuah fungsi yang akan selalu di render(panggil) pertama
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }
    
    function fund() public payable {
        require(
            //todo getConversionRate tambah parameter untuk menerima priceFeed
            msg.value.getConversionRate(s_priceFeed) >= MINIMUMUSD,
            "Kurang dari minimum"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSucces, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSucces, "Call Failed");
    }

    function cheaperWithdraw() public payable onlyOwner{
        address[] memory funders = s_funders;
        for(uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value:  address(this).balance}("");
        require(success, "Kurang dari minimum");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns(address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)  public view returns(uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }

}

// Explainer from: https://solidity-by-example.org/fallback/
// Ether is sent to contract
//      is msg.data empty?
//          /   \
//         yes  no
//         /     \
//    receive()?  fallback()
//     /   \
//   yes   no
//  /        \
//receive()  fallback()
