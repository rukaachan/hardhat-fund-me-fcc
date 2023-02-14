// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    //* penambahan AggregatorV3Interface priceFeed untuk getConversionRate 
    function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) { 
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 10000000000);
    }
    
    function getConversionRate(
        uint256 ehtAmount,
        AggregatorV3Interface priceFeed //* penambahan parameter untuk FundMe
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed); //* penambahan priceFeed parameter

        uint256 ehtAmountInUsd = (ethPrice * ehtAmount) / 10000000000;
        return ehtAmountInUsd;
    }
}
