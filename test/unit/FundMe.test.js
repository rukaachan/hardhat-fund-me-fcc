const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const {developmentChains} = require('../../helper-hardhat-config');

!developmentChains.includes(network.name) ? describe.skip : 
describe("FundMe", async () => {
  // ? penggunaan let bersifat, untuk bisa di deklarasi kembali
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("5"); // 1 ETH;

  beforeEach(async () => {
    //! deploy our fundme contract
    // ? using hardhat deploy
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]); //! > ["all"] penggunaan untuk semua deploy dengan mengambil tag

    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);

    // TODO : beforeEach yang dilakukan untuk contract sama untuk di deploy
  });

  describe("constructor", async () => {
    it("sets the aggregator address correctly ", async () => {
      const response = await fundMe.getPriceFeed(); // ?> untuk pengecekan dalam harga
      assert.equal(response, mockV3Aggregator.address); // ?> untuk melakukan perbandingan
    });
  });

  describe("fund", async () => {
    it("Fails if you don't send enough ETH", async () => {
      /**
      //* AssertionError: Expected transaction to be reverted with reason 'oa', but it reverted with reason 'Kurang dari minimum'
      //? Solusi: harus sama message dengan yang berada di function fund FundMe
       */
      await expect(fundMe.fund()).to.be.revertedWith("Kurang dari minimum");
    });

    it("updated the amount funded data structure", async () => {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer); // ?> untuk pengecekan alamat untuk jumlah dana
      assert.equal(response.toString(), sendValue.toString());
      // ?> Bignumber bersifat object, maka akan untuk perhitungan lebih akurat dengan konversi dengan string
    });

    it("Add getFunder to array of getFunder", async () => {
      await fundMe.fund({ value: sendValue });
      const getFunder = await fundMe.getFunder(0);
      assert.equal(getFunder, deployer);
    });
  });

  describe("withdraw", async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });

    it("Withdraw ETH from a single founder", async () => {
      //! Arrange

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      ); //! cek balance founder, yang akan mengecek address juga
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      ); //! cek balance dalam deplyer
      //! Act

      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1); //! membuat satu block konfirmasi
      const { gasUsed, effectiveGasPrice } = transactionReceipt; //! pull name that
      const gasCost = gasUsed * effectiveGasPrice;
      //! gasCost:  diambil dari transactions yang akan dikembalikkan ke endingDeployerBalance

      const endingFundMe = await fundMe.provider.getBalance(fundMe.address); //! akhir dari balance yang sudah di withdraw
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer); //! begtu juga dengan deployer

      //! Assert
      assert.equal(endingFundMe, 0); //! di saat selesai mengambil dana, seharusnya menjadi 0
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it("Withdraw ETH from a single founder", async () => {
      //! Arrange

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      ); //! cek balance founder, yang akan mengecek address juga
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      ); //! cek balance dalam deplyer
      //! Act

      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1); //! membuat satu block konfirmasi
      const { gasUsed, effectiveGasPrice } = transactionReceipt; //! pull name that
      const gasCost = gasUsed * effectiveGasPrice;
      //! gasCost:  diambil dari transactions yang akan dikembalikkan ke endingDeployerBalance

      const endingFundMe = await fundMe.provider.getBalance(fundMe.address); //! akhir dari balance yang sudah di withdraw
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer); //! begtu juga dengan deployer

      //! Assert
      assert.equal(endingFundMe, 0); //! di saat selesai mengambil dana, seharusnya menjadi 0
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });


    it("allows us to withdraw multiple getFunder", async function () {
      //! Arrange

      /** 
      //? Error: need to specify address
      //todo Solosi: pastikan getSigners, bukan getSigner
      */
      const accounts = await ethers.getSigners();

      /*
      Bila melihat kembali di beforech, terdapat fundMe.getContract("FundMe", deployer);
      fundMe sudah terkoneksi yang akan mengarahkan ke transactions
      */
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      ); //! cek balance founder, yang akan mengecek address juga
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      ); //! cek balance dalam deplyer

      //! Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed * effectiveGasPrice;

      //! Assert
      const endingFundMe = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      //! Assert ||
      assert.equal(endingFundMe, 0); //! di saat selesai mengambil dana, seharusnya menjadi 0
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );

      //! Make sure that getFunder are reset properly
      await expect(fundMe.getFunder(0)).to.be.reverted;

      for (let i = 0; i < 7; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

    it("Only allows the owner to withdraw", async function () {
      /**
       Error: sending a transaction requires a signer (operation="sendTransaction", code=UNSUPPORTED_OPERATION, version=contracts/5.7.0
       Solusi: menambahkan 'await' pada const accounts = ethers.getSigners(); --> const accounts = await ethers.getSigners();
       */
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(
        attackerConnectedContract.withdraw()
      ).to.be.revertedWithCustomError(fundMe, "FundMe_NotOwner");
    });

    it("cheaperWithdraw...", async function () {
      //! Arrange

      /** 
      //? Error: need to specify address
      //todo Solosi: pastikan getSigners, bukan getSigner
      */
      const accounts = await ethers.getSigners();

      /*
      Bila melihat kembali di beforech, terdapat fundMe.getContract("FundMe", deployer);
      fundMe sudah terkoneksi yang akan mengarahkan ke transactions
      */
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      ); //! cek balance founder, yang akan mengecek address juga
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      ); //! cek balance dalam deplyer

      //! Act
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed * effectiveGasPrice;

      //! Assert
      const endingFundMe = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      //! Assert ||
      assert.equal(endingFundMe, 0); //! di saat selesai mengambil dana, seharusnya menjadi 0
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );

      //! Make sure that getFunder are reset properly
      await expect(fundMe.getFunder(0)).to.be.reverted;

      for (let i = 0; i < 7; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

  });
});
