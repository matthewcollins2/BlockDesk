// This script is no longer needed - all Ganache accounts start with 1000 ETH
// Kept for reference only
module.exports = async function(callback) {
  console.log("\nAll Ganache accounts already have 1000 ETH each.");
  console.log("No funding needed!");
  callback();
};
