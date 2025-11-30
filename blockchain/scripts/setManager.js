const BlockDesk = artifacts.require("BlockDesk");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const blockDesk = await BlockDesk.deployed();
    
    console.log("\nCurrent deployer (already Manager):", accounts[0]);
    
    // Addresses to set as Manager
    const newManagers = [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"   // Second Ganache account
    ];
    
    for (const newManager of newManagers) {
      console.log(`\nSetting ${newManager} as Manager...`);
      await blockDesk.setUserRole(newManager, 1, { from: accounts[0] });
      
      // Verify
      const role = await blockDesk.userRoles(newManager);
      const roleNumber = role.toNumber ? role.toNumber() : Number(role);
      console.log(`✓ Role set! ${newManager} is now a ${roleNumber === 1 ? 'Manager' : 'User'} (role value: ${roleNumber})`);
    }
    
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
