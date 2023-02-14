//! sebagai helper untuk yang dapat digunakan untuk
//! pemilihan dalam chain  
const networkConfig = {
  5: {
    name: "Goerli",
    ethUsdPriceFeed: "0x44390589104C9164407A0E0562a9DBe6C24A0E05"
  },
  137: {
    name: "Polygon",
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945"
  }
};

//* digunakan untuk pemilihan develop jaringan yang akand digunakan
const developmentChains = ["hardhat", "local"];

//? variabel ini digunakan untuk helper di MockAggregators.sol 
const DECIMALS = 8;
const INITIAL_ANSWER = 2000000000;


module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
};
