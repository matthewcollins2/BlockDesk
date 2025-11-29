const BlockDesk = artifacts.require("BlockDesk");

module.exports = function (deployer) {
  deployer.deploy(BlockDesk).then(() => {
    console.log("BlockDesk deployed to:", BlockDesk.address);
  });
};