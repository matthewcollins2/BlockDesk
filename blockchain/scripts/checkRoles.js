const BlockDesk = artifacts.require("BlockDesk");

module.exports = async function(callback) {
  try {
    const blockDesk = await BlockDesk.deployed();
    
    const addresses = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    ];
    
    console.log("\nChecking roles...\n");
    
    for (const addr of addresses) {
      const role = await blockDesk.userRoles(addr);
      const roleNumber = role.toNumber ? role.toNumber() : Number(role);
      const roleName = roleNumber === 0 ? "User" : roleNumber === 1 ? "Manager" : "Unknown";
      console.log(`${addr}: ${roleName} (${roleNumber})`);
    }
    
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
